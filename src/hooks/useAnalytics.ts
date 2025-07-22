import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, subHours, format } from 'date-fns';
import { useEffect, useState } from 'react';

export interface AnalyticsData {
  totalChats: number;
  resolutionRate: number;
  avgResponseTime: number;
  faqHitRate: number;
  userSatisfactionScore: number;
  escalationRate: number;
  chatVolumeData: Array<{
    name: string;
    chats: number;
    resolved: number;
    escalated: number;
  }>;
  faqHitData: Array<{
    category: string;
    hits: number;
    percentage: number;
  }>;
  responseTimeData: Array<{
    hour: string;
    avgTime: number;
  }>;
  topFAQQuestions: Array<{
    question: string;
    hits: number;
    helpfulVotes: number;
    totalVotes: number;
  }>;
  satisfactionTrend: Array<{
    date: string;
    helpful: number;
    notHelpful: number;
    score: number;
  }>;
  weeklyChange: {
    chats: number;
    resolution: number;
    responseTime: number;
    satisfaction: number;
  };
}

// Real-time analytics hook with Supabase subscriptions
export const useRealTimeAnalytics = (period: '24hours' | '7days' | '30days' | '90days' = '7days') => {
  const [realTimeData, setRealTimeData] = useState<Partial<AnalyticsData>>({});
  
  useEffect(() => {
    // Subscribe to real-time changes in chat conversations
    const chatSubscription = supabase
      .channel('analytics-chats')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_conversations' 
        }, 
        (payload) => {
          console.log('Real-time chat update:', payload);
          // Trigger analytics refresh when new chat data comes in
          setRealTimeData(prev => ({ ...prev, _timestamp: Date.now() }));
        }
      )
      .subscribe();

    // Subscribe to real-time changes in escalated queries
    const escalationSubscription = supabase
      .channel('analytics-escalations')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'escalated_queries' 
        }, 
        (payload) => {
          console.log('Real-time escalation update:', payload);
          setRealTimeData(prev => ({ ...prev, _timestamp: Date.now() }));
        }
      )
      .subscribe();

    // Subscribe to real-time changes in FAQ analytics
    const faqSubscription = supabase
      .channel('analytics-faqs')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'faqs' 
        }, 
        (payload) => {
          console.log('Real-time FAQ update:', payload);
          setRealTimeData(prev => ({ ...prev, _timestamp: Date.now() }));
        }
      )
      .subscribe();

    return () => {
      chatSubscription.unsubscribe();
      escalationSubscription.unsubscribe();
      faqSubscription.unsubscribe();
    };
  }, []);

  return realTimeData;
};

export const useAnalytics = (period: '24hours' | '7days' | '30days' | '90days' = '7days') => {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: async (): Promise<AnalyticsData> => {
      const now = new Date();
      let startDate: Date;
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;

      switch (period) {
        case '24hours':
          startDate = subHours(now, 24);
          previousPeriodStart = subHours(startDate, 24);
          previousPeriodEnd = startDate;
          break;
        case '7days':
          startDate = subDays(now, 7);
          previousPeriodStart = subDays(startDate, 7);
          previousPeriodEnd = startDate;
          break;
        case '30days':
          startDate = subDays(now, 30);
          previousPeriodStart = subDays(startDate, 30);
          previousPeriodEnd = startDate;
          break;
        case '90days':
          startDate = subDays(now, 90);
          previousPeriodStart = subDays(startDate, 90);
          previousPeriodEnd = startDate;
          break;
      }

      // Get total chats
      const { data: currentChats } = await supabase
        .from('chat_conversations')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString());

      const { data: previousChats } = await supabase
        .from('chat_conversations')
        .select('*')
        .gte('created_at', previousPeriodStart.toISOString())
        .lte('created_at', previousPeriodEnd.toISOString());

      const totalChats = currentChats?.length || 0;
      const previousTotalChats = previousChats?.length || 0;

      // Calculate resolution rate (chats with responses)
      const resolvedChats = currentChats?.filter(chat => chat.response && !chat.escalated) || [];
      const previousResolvedChats = previousChats?.filter(chat => chat.response && !chat.escalated) || [];
      
      const resolutionRate = totalChats > 0 ? Math.round((resolvedChats.length / totalChats) * 100) : 0;
      const previousResolutionRate = previousTotalChats > 0 ? Math.round((previousResolvedChats.length / previousTotalChats) * 100) : 0;

      // Calculate escalation rate and user satisfaction
      const escalatedChats = currentChats?.filter(chat => chat.escalated) || [];
      const escalationRate = totalChats > 0 ? Math.round((escalatedChats.length / totalChats) * 100) : 0;
      
      // Calculate user satisfaction score based on helpful/not helpful ratings
      const ratedChats = currentChats?.filter(chat => chat.is_helpful !== null) || [];
      const helpfulRatings = ratedChats.filter(chat => chat.is_helpful === true);
      const userSatisfactionScore = ratedChats.length > 0 
        ? Math.round((helpfulRatings.length / ratedChats.length) * 100) 
        : 0;
      
      const previousRatedChats = previousChats?.filter(chat => chat.is_helpful !== null) || [];
      const previousHelpfulRatings = previousRatedChats.filter(chat => chat.is_helpful === true);
      const previousSatisfactionScore = previousRatedChats.length > 0 
        ? Math.round((previousHelpfulRatings.length / previousRatedChats.length) * 100) 
        : 0;

      // Get FAQ analytics
      const { data: faqs } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true);

      const totalFAQViews = faqs?.reduce((sum, faq) => sum + (faq.view_count || 0), 0) || 0;
      const faqMatchedChats = currentChats?.filter(chat => chat.faq_matched_id) || [];
      const faqHitRate = totalChats > 0 ? Math.round((faqMatchedChats.length / totalChats) * 100) : 0;

      // Calculate average response time (mock data for now as we don't track this yet)
      const avgResponseTime = 2.4; // minutes
      const previousAvgResponseTime = 2.55; // minutes

      // Generate chat volume data for the period
      const chatVolumeData = [];
      const daysToShow = period === '24hours' ? 1 : period === '7days' ? 7 : period === '30days' ? 30 : 90;
      
      for (let i = daysToShow - 1; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        const dayChats = currentChats?.filter(chat => {
          const chatDate = new Date(chat.created_at);
          return chatDate >= dayStart && chatDate <= dayEnd;
        }) || [];
        
        const dayResolved = dayChats.filter(chat => chat.response && !chat.escalated);
        const dayEscalated = dayChats.filter(chat => chat.escalated);
        
        chatVolumeData.push({
          name: format(day, period === '24hours' ? 'HH:mm' : 'EEE'),
          chats: dayChats.length,
          resolved: dayResolved.length,
          escalated: dayEscalated.length,
        });
      }

      // FAQ category distribution
      const categoryData = new Map();
      faqs?.forEach(faq => {
        const count = categoryData.get(faq.category) || 0;
        categoryData.set(faq.category, count + (faq.view_count || 0));
      });

      const totalCategoryHits = Array.from(categoryData.values()).reduce((sum, count) => sum + count, 0);
      const faqHitData = Array.from(categoryData.entries()).map(([category, hits]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        hits,
        percentage: totalCategoryHits > 0 ? Math.round((hits / totalCategoryHits) * 100) : 0,
      }));

      // Response time pattern (mock data for now)
      const responseTimeData = [
        { hour: "00:00", avgTime: 2.1 },
        { hour: "04:00", avgTime: 1.8 },
        { hour: "08:00", avgTime: 3.2 },
        { hour: "12:00", avgTime: 4.1 },
        { hour: "16:00", avgTime: 3.8 },
        { hour: "20:00", avgTime: 2.9 },
      ];

      // Top FAQ questions with helpful votes
      const topFAQQuestions = faqs
        ?.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 4)
        .map(faq => ({
          question: faq.question,
          hits: faq.view_count || 0,
          helpfulVotes: faq.helpful_count || 0,
          totalVotes: (faq.helpful_count || 0) + (faq.not_helpful_count || 0),
        })) || [];

      // Generate satisfaction trend data
      const satisfactionTrend = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        const dayChats = currentChats?.filter(chat => {
          const chatDate = new Date(chat.created_at);
          return chatDate >= dayStart && chatDate <= dayEnd && chat.is_helpful !== null;
        }) || [];
        
        const helpful = dayChats.filter(chat => chat.is_helpful === true).length;
        const notHelpful = dayChats.filter(chat => chat.is_helpful === false).length;
        const total = helpful + notHelpful;
        const score = total > 0 ? Math.round((helpful / total) * 100) : 0;
        
        satisfactionTrend.push({
          date: format(day, 'MM/dd'),
          helpful,
          notHelpful,
          score,
        });
      }

      // Weekly changes including satisfaction
      const chatsChange = previousTotalChats > 0 
        ? Math.round(((totalChats - previousTotalChats) / previousTotalChats) * 100)
        : 0;
      
      const resolutionChange = previousResolutionRate > 0
        ? resolutionRate - previousResolutionRate
        : 0;

      const responseTimeChange = Math.round((previousAvgResponseTime - avgResponseTime) * 60); // in seconds
      
      const satisfactionChange = previousSatisfactionScore > 0
        ? userSatisfactionScore - previousSatisfactionScore
        : 0;

      return {
        totalChats,
        resolutionRate,
        avgResponseTime,
        faqHitRate,
        userSatisfactionScore,
        escalationRate,
        chatVolumeData,
        faqHitData,
        responseTimeData,
        topFAQQuestions,
        satisfactionTrend,
        weeklyChange: {
          chats: chatsChange,
          resolution: resolutionChange,
          responseTime: responseTimeChange,
          satisfaction: satisfactionChange,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};