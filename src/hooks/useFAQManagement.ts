
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FAQ = Database['public']['Tables']['faqs']['Row'];
type FAQInsert = Database['public']['Tables']['faqs']['Insert'];
type FAQUpdate = Database['public']['Tables']['faqs']['Update'];
type FAQCategory = Database['public']['Enums']['faq_category'];
type ScooterModel = Database['public']['Enums']['scooter_model'];

export const useFAQManagement = () => {
  const queryClient = useQueryClient();

  // Get all FAQs (admin view)
  const useAllFAQs = () => {
    return useQuery({
      queryKey: ['admin', 'faqs'],
      queryFn: async (): Promise<FAQ[]> => {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching FAQs:', error);
          throw error;
        }
        return data || [];
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Create FAQ
  const useCreateFAQ = () => {
    return useMutation({
      mutationFn: async (faqData: Omit<FAQInsert, 'id' | 'created_at' | 'updated_at'>): Promise<FAQ> => {
        const { data, error } = await supabase
          .from('faqs')
          .insert(faqData)
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error creating FAQ:', error);
          throw error;
        }
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
        queryClient.invalidateQueries({ queryKey: ['faqs'] });
        toast.success('FAQ created successfully');
      },
      onError: (error) => {
        console.error('FAQ creation error:', error);
        toast.error('Failed to create FAQ');
      },
    });
  };

  // Update FAQ
  const useUpdateFAQ = () => {
    return useMutation({
      mutationFn: async ({ id, updates }: { id: string; updates: FAQUpdate }): Promise<FAQ> => {
        const { data, error } = await supabase
          .from('faqs')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error updating FAQ:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('FAQ not found or update failed');
        }
        
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
        queryClient.invalidateQueries({ queryKey: ['faqs'] });
        toast.success('FAQ updated successfully');
      },
      onError: (error) => {
        console.error('FAQ update error:', error);
        toast.error('Failed to update FAQ');
      },
    });
  };

  // Delete FAQ
  const useDeleteFAQ = () => {
    return useMutation({
      mutationFn: async (id: string): Promise<void> => {
        const { error } = await supabase
          .from('faqs')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting FAQ:', error);
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
        queryClient.invalidateQueries({ queryKey: ['faqs'] });
        toast.success('FAQ deleted successfully');
      },
      onError: (error) => {
        console.error('FAQ deletion error:', error);
        toast.error('Failed to delete FAQ');
      },
    });
  };

  // Bulk operations
  const useBulkUpdateFAQs = () => {
    return useMutation({
      mutationFn: async (updates: { ids: string[]; data: Partial<FAQUpdate> }): Promise<void> => {
        const { error } = await supabase
          .from('faqs')
          .update({ ...updates.data, updated_at: new Date().toISOString() })
          .in('id', updates.ids);

        if (error) {
          console.error('Error bulk updating FAQs:', error);
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'faqs'] });
        queryClient.invalidateQueries({ queryKey: ['faqs'] });
        toast.success('FAQs updated successfully');
      },
      onError: (error) => {
        console.error('Bulk FAQ update error:', error);
        toast.error('Failed to update FAQs');
      },
    });
  };

  // FAQ Analytics
  const useFAQAnalytics = () => {
    return useQuery({
      queryKey: ['admin', 'faq-analytics'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('faqs')
          .select('id, question, view_count, helpful_count, not_helpful_count, category, created_at')
          .order('view_count', { ascending: false });

        if (error) {
          console.error('Error fetching FAQ analytics:', error);
          throw error;
        }

        // Calculate analytics
        const totalFAQs = data?.length || 0;
        const totalViews = data?.reduce((sum, faq) => sum + (faq.view_count || 0), 0) || 0;
        const totalHelpful = data?.reduce((sum, faq) => sum + (faq.helpful_count || 0), 0) || 0;
        const totalNotHelpful = data?.reduce((sum, faq) => sum + (faq.not_helpful_count || 0), 0) || 0;
        const avgHelpfulnessRate = totalHelpful + totalNotHelpful > 0 
          ? (totalHelpful / (totalHelpful + totalNotHelpful)) * 100 
          : 0;

        return {
          faqs: data || [],
          analytics: {
            totalFAQs,
            totalViews,
            totalHelpful,
            totalNotHelpful,
            avgHelpfulnessRate: Math.round(avgHelpfulnessRate * 100) / 100
          }
        };
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // System settings for confidence threshold
  const useConfidenceThreshold = () => {
    return useQuery({
      queryKey: ['system-settings', 'faq_confidence_threshold'],
      queryFn: async (): Promise<number> => {
        const { data, error } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'faq_confidence_threshold')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching confidence threshold:', error);
          throw error;
        }
        
        return data ? parseFloat(data.setting_value) : 0.15; // Default 15%
      },
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  };

  const useUpdateConfidenceThreshold = () => {
    return useMutation({
      mutationFn: async (threshold: number): Promise<void> => {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: 'faq_confidence_threshold',
            setting_value: threshold.toString(),
            description: 'Minimum confidence threshold for FAQ matching',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'setting_key'
          });

        if (error) {
          console.error('Error updating confidence threshold:', error);
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['system-settings', 'faq_confidence_threshold'] });
        toast.success('Confidence threshold updated successfully');
      },
      onError: (error) => {
        console.error('Confidence threshold update error:', error);
        toast.error('Failed to update confidence threshold');
      },
    });
  };

  return {
    useAllFAQs,
    useCreateFAQ,
    useUpdateFAQ,
    useDeleteFAQ,
    useBulkUpdateFAQs,
    useFAQAnalytics,
    useConfidenceThreshold,
    useUpdateConfidenceThreshold
  };
};

export const FAQ_CATEGORIES: { value: FAQCategory; label: string }[] = [
  { value: 'charging', label: 'Charging' },
  { value: 'service', label: 'Service' },
  { value: 'range', label: 'Range' },
  { value: 'orders', label: 'Orders' },
  { value: 'cost', label: 'Cost' },
  { value: 'license', label: 'License' },
  { value: 'warranty', label: 'Warranty' }
];

export const SCOOTER_MODELS: { value: ScooterModel; label: string }[] = [
  { value: '450S', label: 'Ather 450S' },
  { value: '450X', label: 'Ather 450X' },
  { value: 'Rizta', label: 'Ather Rizta' }
];
