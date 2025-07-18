
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, type Profile, type FAQ, type Order, type ChatConversation } from '@/lib/database';
import { toast } from 'sonner';

/**
 * Custom hooks for database operations with React Query integration
 */

// Profile hooks
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: db.profiles.getCurrentProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: db.profiles.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    },
  });
};

// FAQ hooks
export const useFAQs = (category?: string) => {
  return useQuery({
    queryKey: ['faqs', category],
    queryFn: () => db.faqs.getActiveFAQs(category as any),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSearchFAQs = (searchText: string, scooterModel?: string) => {
  return useQuery({
    queryKey: ['faqs', 'search', searchText, scooterModel],
    queryFn: () => db.faqs.searchFAQs(searchText, scooterModel as any),
    enabled: searchText.length > 2, // Only search if query is longer than 2 characters
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Order hooks
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: db.orders.getUserOrders,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOrderByNumber = (orderNumber: string) => {
  return useQuery({
    queryKey: ['orders', orderNumber],
    queryFn: () => db.orders.getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Chat hooks
export const useConversations = (sessionId?: string) => {
  return useQuery({
    queryKey: ['conversations', sessionId],
    queryFn: () => db.chats.getUserConversations(sessionId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, query, response, faqMatchedId, confidenceScore }: {
      sessionId: string;
      query: string;
      response?: string;
      faqMatchedId?: string;
      confidenceScore?: number;
    }) => db.chats.createConversation(sessionId, query, response, faqMatchedId, confidenceScore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Conversation creation error:', error);
      toast.error('Failed to save conversation');
    },
  });
};

// Analytics hook
export const useTrackEvent = () => {
  return useMutation({
    mutationFn: ({ eventType, eventData, sessionId }: {
      eventType: string;
      eventData?: any;
      sessionId?: string;
    }) => db.analytics.trackEvent(eventType, eventData, sessionId),
    onError: (error) => {
      console.error('Analytics tracking error:', error);
    },
  });
};

// System settings hook
export const useSystemSetting = (key: string) => {
  return useQuery({
    queryKey: ['settings', key],
    queryFn: () => db.settings.getSetting(key),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
