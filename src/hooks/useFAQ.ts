
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type FAQ = Database['public']['Tables']['faqs']['Row'];
type FAQCategory = Database['public']['Enums']['faq_category'];
type ScooterModel = Database['public']['Enums']['scooter_model'];

interface FAQSearchParams {
  query?: string;
  category?: FAQCategory;
  scooterModels?: ScooterModel[];
  limit?: number;
}

interface FAQWithSimilarity extends FAQ {
  similarity_score?: number;
}

// Get system settings for confidence threshold
export const useConfidenceThreshold = () => {
  return useQuery({
    queryKey: ['system-settings', 'confidence_threshold'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'confidence_threshold')
        .maybeSingle();

      if (error || !data) {
        console.log('Using default confidence threshold: 0.7');
        return 0.7; // Default threshold
      }

      return parseFloat(data.setting_value);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all FAQs with optional filtering
export const useFAQs = (params: FAQSearchParams = {}) => {
  return useQuery({
    queryKey: ['faqs', params],
    queryFn: async (): Promise<FAQ[]> => {
      let query = supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('helpful_count', { ascending: false });

      // Filter by category
      if (params.category) {
        query = query.eq('category', params.category);
      }

      // Filter by scooter models
      if (params.scooterModels && params.scooterModels.length > 0) {
        query = query.overlaps('scooter_models', params.scooterModels);
      }

      // Apply limit
      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('FAQ fetch error:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Search FAQs with text similarity
export const useSearchFAQs = (searchQuery: string, userScooterModels?: ScooterModel[]) => {
  const { data: confidenceThreshold } = useConfidenceThreshold();

  return useQuery({
    queryKey: ['faqs-search', searchQuery, userScooterModels],
    queryFn: async (): Promise<FAQWithSimilarity[]> => {
      if (!searchQuery.trim()) {
        return [];
      }

      console.log('Searching FAQs with query:', searchQuery);

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
              query_text: searchQuery,
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

      // Filter by confidence threshold
      const threshold = confidenceThreshold || 0.7;
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
    enabled: !!searchQuery.trim(),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get FAQs by category
export const useFAQsByCategory = (category: FAQCategory) => {
  return useFAQs({ category });
};

// Rate FAQ helpfulness
export const useRateFAQ = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ faqId, isHelpful }: { faqId: string; isHelpful: boolean }) => {
      console.log('Rating FAQ:', faqId, 'as', isHelpful ? 'helpful' : 'not helpful');

      // Get current FAQ data
      const { data: currentFAQ, error: fetchError } = await supabase
        .from('faqs')
        .select('helpful_count, not_helpful_count')
        .eq('id', faqId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      // Update counts
      const updateData = isHelpful
        ? { helpful_count: (currentFAQ.helpful_count || 0) + 1 }
        : { not_helpful_count: (currentFAQ.not_helpful_count || 0) + 1 };

      const { data, error } = await supabase
        .from('faqs')
        .update(updateData)
        .eq('id', faqId)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all FAQ queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve our FAQs.",
      });
    },
    onError: (error) => {
      console.error('FAQ rating error:', error);
      toast({
        title: "Rating Failed",
        description: "Failed to submit your feedback. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Increment FAQ view count
export const useIncrementFAQView = () => {
  return useMutation({
    mutationFn: async (faqId: string) => {
      // Get the current view count
      const { data: currentFAQ, error: fetchError } = await supabase
        .from('faqs')
        .select('view_count')
        .eq('id', faqId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      // Update with incremented value
      const { data, error } = await supabase
        .from('faqs')
        .update({ 
          view_count: (currentFAQ.view_count || 0) + 1
        })
        .eq('id', faqId)
        .select()
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    onError: (error) => {
      console.error('FAQ view increment error:', error);
      // Don't show error toast for view counting failures
    },
  });
};
