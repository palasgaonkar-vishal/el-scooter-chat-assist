
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Type aliases for better readability
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type FAQ = Database['public']['Tables']['faqs']['Row'];
export type ChatConversation = Database['public']['Tables']['chat_conversations']['Row'];
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type EscalatedQuery = Database['public']['Tables']['escalated_queries']['Row'];
export type Analytics = Database['public']['Tables']['analytics']['Row'];
export type SystemSetting = Database['public']['Tables']['system_settings']['Row'];

// Enum types
export type UserRole = Database['public']['Enums']['user_role'];
export type ScooterModel = Database['public']['Enums']['scooter_model'];
export type FAQCategory = Database['public']['Enums']['faq_category'];
export type OrderStatus = Database['public']['Enums']['order_status'];
export type EscalationPriority = Database['public']['Enums']['escalation_priority'];
export type EscalationStatus = Database['public']['Enums']['escalation_status'];

/**
 * Database utility functions for common operations
 */
export const db = {
  // Profile operations
  profiles: {
    async getCurrentProfile(): Promise<Profile | null> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },

    async updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }
      return data;
    }
  },

  // FAQ operations
  faqs: {
    async getActiveFAQs(category?: FAQCategory): Promise<FAQ[]> {
      let query = supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('view_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching FAQs:', error);
        return [];
      }
      return data || [];
    },

    async searchFAQs(searchText: string, scooterModel?: ScooterModel): Promise<{ faq: FAQ; similarity: number }[]> {
      // Get all active FAQs first
      let query = supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true);

      if (scooterModel) {
        query = query.contains('scooter_models', [scooterModel]);
      }

      const { data: faqs, error } = await query;

      if (error) {
        console.error('Error fetching FAQs for search:', error);
        return [];
      }

      if (!faqs) return [];

      // Calculate similarity for each FAQ using the database function
      const results: { faq: FAQ; similarity: number }[] = [];

      for (const faq of faqs) {
        try {
          const { data: similarity, error: simError } = await supabase.rpc('calculate_text_similarity', {
            query_text: searchText,
            faq_question: faq.question,
            faq_answer: faq.answer
          });

          if (!simError && similarity !== null) {
            results.push({ faq, similarity });
          }
        } catch (error) {
          console.error('Error calculating similarity for FAQ:', faq.id, error);
        }
      }

      // Sort by similarity score (highest first) and return top matches
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10); // Return top 10 matches
    },

    async incrementViewCount(faqId: string): Promise<void> {
      // First get the current view count
      const { data: faq, error: fetchError } = await supabase
        .from('faqs')
        .select('view_count')
        .eq('id', faqId)
        .single();

      if (fetchError) {
        console.error('Error fetching FAQ for view count:', fetchError);
        return;
      }

      // Then update with incremented value
      const { error } = await supabase
        .from('faqs')
        .update({ 
          view_count: (faq?.view_count || 0) + 1
        })
        .eq('id', faqId);

      if (error) {
        console.error('Error incrementing FAQ view count:', error);
      }
    }
  },

  // Chat operations
  chats: {
    async createSession(): Promise<ChatSession | null> {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        return null;
      }
      return data;
    },

    async getSession(sessionId: string): Promise<ChatSession | null> {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }
      return data;
    },

    async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating session:', error);
        return null;
      }
      return data;
    },

    async createConversation(sessionId: string, query: string, response?: string, faqMatchedId?: string, confidenceScore?: number): Promise<ChatConversation | null> {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          query,
          response,
          faq_matched_id: faqMatchedId,
          confidence_score: confidenceScore
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }
      return data;
    },

    async getUserConversations(sessionId?: string): Promise<ChatConversation[]> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
      return data || [];
    },

    async updateConversation(conversationId: string, updates: Partial<ChatConversation>): Promise<ChatConversation | null> {
      const { data, error } = await supabase
        .from('chat_conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating conversation:', error);
        return null;
      }
      return data;
    }
  },

  // Order operations
  orders: {
    async getUserOrders(): Promise<Order[]> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }
      return data || [];
    },

    async getOrderByNumber(orderNumber: string): Promise<Order | null> {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) {
        console.error('Error fetching order:', error);
        return null;
      }
      return data;
    }
  },

  // Analytics operations
  analytics: {
    async trackEvent(eventType: string, eventData?: any, sessionId?: string): Promise<void> {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('analytics')
        .insert({
          event_type: eventType,
          event_data: eventData,
          user_id: user?.id || null,
          session_id: sessionId
        });

      if (error) {
        console.error('Error tracking analytics event:', error);
      }
    }
  },

  // System settings
  settings: {
    async getSetting(key: string): Promise<string | null> {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .single();

      if (error) {
        console.error('Error fetching setting:', error);
        return null;
      }
      return data?.setting_value || null;
    },

    async getConfidenceThreshold(): Promise<number> {
      const threshold = await this.getSetting('faq_confidence_threshold');
      return threshold ? parseFloat(threshold) : 0.7;
    }
  }
};

// Constants for easy reference
export const SCOOTER_MODELS: ScooterModel[] = ['450S', '450X', 'Rizta'];
export const FAQ_CATEGORIES: FAQCategory[] = ['charging', 'service', 'range', 'orders', 'cost', 'license', 'warranty'];
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
export const ESCALATION_PRIORITIES: EscalationPriority[] = ['low', 'medium', 'high', 'critical'];
export const ESCALATION_STATUSES: EscalationStatus[] = ['pending', 'in_progress', 'resolved', 'closed'];
