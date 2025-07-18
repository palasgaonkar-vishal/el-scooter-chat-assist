
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/database';
import { useSearchFAQs } from '@/hooks/useFAQ';
import { toast } from 'sonner';
import type { ChatConversation } from '@/lib/database';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  files?: FileUpload[];
  faqMatched?: boolean;
  confidenceScore?: number;
  isHelpful?: boolean;
  canRate?: boolean;
}

export interface FileUpload {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  isActive: boolean;
}

export const useChat = () => {
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Get or create chat session
  const { data: session } = useQuery({
    queryKey: ['chatSession', currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return null;
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', currentSessionId)
        .single();
      
      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }
      return data;
    },
    enabled: !!currentSessionId,
  });

  // Load chat history
  const { data: conversations } = useQuery({
    queryKey: ['conversations', currentSessionId],
    queryFn: () => currentSessionId ? db.chats.getUserConversations(currentSessionId) : [],
    enabled: !!currentSessionId,
  });

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Convert conversations to messages when data changes
  useEffect(() => {
    if (conversations) {
      const chatMessages: ChatMessage[] = conversations.flatMap((conv) => {
        const userMessage: ChatMessage = {
          id: `${conv.id}-user`,
          content: conv.query,
          sender: 'user',
          timestamp: new Date(conv.created_at || ''),
          files: conv.file_urls?.map((url, index) => ({
            id: `file-${index}`,
            name: url.split('/').pop() || 'file',
            url,
            type: 'unknown',
            size: 0,
          })) || [],
        };

        const botMessage: ChatMessage = {
          id: `${conv.id}-bot`,
          content: conv.response || 'I\'m processing your request...',
          sender: 'bot',
          timestamp: new Date(conv.created_at || ''),
          faqMatched: !!conv.faq_matched_id,
          confidenceScore: conv.confidence_score || undefined,
          isHelpful: conv.is_helpful || undefined,
          canRate: conv.response !== null && conv.is_helpful === null,
        };

        return [userMessage, botMessage];
      });

      setMessages(chatMessages);
    }
  }, [conversations]);

  const initializeSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentSessionId(data.id);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast.error('Failed to start chat session');
    }
  };

  return {
    messages,
    currentSessionId,
    isTyping,
    setIsTyping,
    initializeSession,
  };
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      message, 
      sessionId, 
      files = [] 
    }: { 
      message: string; 
      sessionId: string; 
      files?: File[] 
    }) => {
      // Upload files first if any
      const fileUrls: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          const { data, error } = await supabase.storage
            .from('chat-files')
            .upload(fileName, file);

          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage
            .from('chat-files')
            .getPublicUrl(data.path);
          
          fileUrls.push(publicUrl);
        }
      }

      // Create conversation record
      const conversation = await db.chats.createConversation(
        sessionId,
        message,
        undefined, // response will be set by AI processing
        undefined, // faq match will be determined by similarity search
        undefined, // confidence score will be calculated
      );

      if (!conversation) {
        throw new Error('Failed to create conversation');
      }

      // Update with file URLs if any
      if (fileUrls.length > 0) {
        const { error } = await supabase
          .from('chat_conversations')
          .update({ file_urls: fileUrls })
          .eq('id', conversation.id);

        if (error) throw error;
      }

      return { conversation, fileUrls };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    },
  });
};

export const useProcessAIResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, query }: { conversationId: string; query: string }) => {
      // Get user profile to get scooter models
      const profile = await db.profiles.getCurrentProfile();
      const userScooterModels = profile?.scooter_models || [];

      // Search for matching FAQs using queryClient.fetchQuery (returns data directly)
      const faqResults = await queryClient.fetchQuery({
        queryKey: ['faqs-search', query, userScooterModels],
        queryFn: async () => {
          if (!query.trim()) return [];

          console.log('Searching FAQs with query:', query);

          // Get all active FAQs
          const { data: faqs, error } = await supabase
            .from('faqs')
            .select('*')
            .eq('is_active', true);

          if (error) {
            console.error('FAQ search error:', error);
            throw error;
          }

          if (!faqs || faqs.length === 0) {
            return [];
          }

          // Calculate similarity for each FAQ using the database function
          const resultsWithSimilarity = await Promise.all(
            faqs.map(async (faq) => {
              const { data: similarity, error: simError } = await supabase
                .rpc('calculate_text_similarity', {
                  query_text: query,
                  faq_question: faq.question,
                  faq_answer: faq.answer
                });

              if (simError) {
                console.error('Similarity calculation error:', simError);
                return { ...faq, similarity_score: 0 };
              }

              return { ...faq, similarity_score: similarity || 0 };
            })
          );

          // Get confidence threshold
          const threshold = 0.7; // Default threshold
          let filteredResults = resultsWithSimilarity.filter(
            (faq) => (faq.similarity_score || 0) >= threshold
          );

          // Prioritize FAQs that match user's scooter models
          if (userScooterModels && userScooterModels.length > 0) {
            filteredResults = filteredResults.sort((a, b) => {
              const aHasUserModel = a.scooter_models?.some(model => userScooterModels.includes(model));
              const bHasUserModel = b.scooter_models?.some(model => userScooterModels.includes(model));
              
              if (aHasUserModel && !bHasUserModel) return -1;
              if (!aHasUserModel && bHasUserModel) return 1;
              
              // If both or neither have user models, sort by similarity score
              return (b.similarity_score || 0) - (a.similarity_score || 0);
            });
          } else {
            // Sort by similarity score
            filteredResults.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
          }

          console.log(`Found ${filteredResults.length} FAQs above ${threshold} confidence threshold`);
          return filteredResults;
        },
      });
      
      let response = "I'm sorry, I couldn't find a specific answer to your question. Our team will review this and get back to you.";
      let faqMatchedId: string | undefined;
      let confidenceScore = 0;
      let shouldEscalate = true;

      if (faqResults && faqResults.length > 0) {
        const bestMatch = faqResults[0];
        confidenceScore = bestMatch.similarity_score || 0;
        
        // Get confidence threshold from system settings
        const threshold = await db.settings.getConfidenceThreshold();
        
        if (confidenceScore >= threshold) {
          response = bestMatch.answer;
          faqMatchedId = bestMatch.id;
          shouldEscalate = false;
          
          // Increment FAQ view count
          await db.faqs.incrementViewCount(bestMatch.id);
        }
      }

      // Update conversation with AI response
      const { data, error } = await supabase
        .from('chat_conversations')
        .update({
          response,
          faq_matched_id: faqMatchedId,
          confidence_score: confidenceScore,
          escalated: shouldEscalate,
          escalated_at: shouldEscalate ? new Date().toISOString() : null,
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      // Track analytics
      await db.analytics.trackEvent('chat_response_generated', {
        conversation_id: conversationId,
        confidence_score: confidenceScore,
        faq_matched: !!faqMatchedId,
        escalated: shouldEscalate,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('AI response processing error:', error);
      toast.error('Failed to process AI response');
    },
  });
};

export const useRateResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ conversationId, isHelpful }: { conversationId: string; isHelpful: boolean }) => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .update({ 
          is_helpful: isHelpful,
          escalated: !isHelpful, // Escalate if marked as not helpful
          escalated_at: !isHelpful ? new Date().toISOString() : null,
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      // Update FAQ helpful/not helpful counts if FAQ was matched
      if (data.faq_matched_id) {
        const column = isHelpful ? 'helpful_count' : 'not_helpful_count';
        const { data: faq } = await supabase
          .from('faqs')
          .select(column)
          .eq('id', data.faq_matched_id)
          .single();

        if (faq) {
          await supabase
            .from('faqs')
            .update({ [column]: (faq[column] || 0) + 1 })
            .eq('id', data.faq_matched_id);
        }
      }

      // Track analytics
      await db.analytics.trackEvent('response_rated', {
        conversation_id: conversationId,
        is_helpful: isHelpful,
        faq_matched_id: data.faq_matched_id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Thank you for your feedback!');
    },
    onError: (error) => {
      console.error('Rating error:', error);
      toast.error('Failed to submit rating');
    },
  });
};
