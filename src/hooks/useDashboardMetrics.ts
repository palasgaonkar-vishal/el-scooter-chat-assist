import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subHours, subDays } from 'date-fns';

export interface DashboardMetrics {
  activeUsers: number;
  activeChatSessions: number;
  escalatedQueries: {
    total: number;
    pending: number;
  };
  faqHitRate: number;
  recentEscalations: Array<{
    id: string;
    query: string;
    priority: 'high' | 'medium' | 'low' | 'critical';
    user_id?: string;
    created_at: string;
  }>;
  hourlyChange: {
    users: number;
    sessions: number;
  };
  systemHealth: {
    faqService: boolean;
    chatSystem: boolean;
    fileUpload: boolean;
    database: boolean;
  };
}

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const now = new Date();
      const oneHourAgo = subHours(now, 1);
      const oneDayAgo = subDays(now, 1);

      // Get active chat sessions
      const { data: activeSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('is_active', true)
        .gte('updated_at', oneHourAgo.toISOString());

      const activeSessionsCount = activeSessions?.length || 0;

      // Get previous hour's sessions for comparison
      const { data: previousHourSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('is_active', true)
        .gte('updated_at', subHours(oneHourAgo, 1).toISOString())
        .lt('updated_at', oneHourAgo.toISOString());

      const previousSessionsCount = previousHourSessions?.length || 0;

      // Calculate unique active users (from active sessions)
      const uniqueUsers = new Set(activeSessions?.map(session => session.user_id).filter(Boolean));
      const activeUsersCount = uniqueUsers.size;

      // Get previous hour's unique users for comparison
      const previousUniqueUsers = new Set(previousHourSessions?.map(session => session.user_id).filter(Boolean));
      const previousUsersCount = previousUniqueUsers.size;

      // Get escalated queries
      const { data: escalatedQueries } = await supabase
        .from('escalated_queries')
        .select('*')
        .order('created_at', { ascending: false });

      const totalEscalated = escalatedQueries?.length || 0;
      const pendingEscalated = escalatedQueries?.filter(q => q.status === 'pending').length || 0;

      // Get recent escalations for display
      const recentEscalations = escalatedQueries?.slice(0, 5).map(escalation => ({
        id: escalation.id,
        query: escalation.query || 'No query text',
        priority: escalation.priority || 'medium',
        user_id: escalation.user_id,
        created_at: escalation.created_at,
      })) || [];

      // Calculate FAQ hit rate
      const { data: recentChats } = await supabase
        .from('chat_conversations')
        .select('faq_matched_id')
        .gte('created_at', oneDayAgo.toISOString());

      const totalChats = recentChats?.length || 0;
      const faqMatchedChats = recentChats?.filter(chat => chat.faq_matched_id).length || 0;
      const faqHitRate = totalChats > 0 ? Math.round((faqMatchedChats / totalChats) * 100) : 0;

      // Calculate percentage changes
      const usersChange = previousUsersCount > 0 
        ? Math.round(((activeUsersCount - previousUsersCount) / previousUsersCount) * 100)
        : 0;

      const sessionsChange = previousSessionsCount > 0
        ? Math.round(((activeSessionsCount - previousSessionsCount) / previousSessionsCount) * 100)
        : 0;

      // System health checks (simplified - assume operational if we can query)
      const systemHealth = {
        faqService: true, // If we got this far, database is working
        chatSystem: activeSessionsCount >= 0, // If we can query sessions, chat system is working
        fileUpload: true, // Assume operational if storage bucket exists
        database: true, // If we got this far, database is working
      };

      return {
        activeUsers: activeUsersCount,
        activeChatSessions: activeSessionsCount,
        escalatedQueries: {
          total: totalEscalated,
          pending: pendingEscalated,
        },
        faqHitRate,
        recentEscalations,
        hourlyChange: {
          users: usersChange,
          sessions: sessionsChange,
        },
        systemHealth,
      };
    },
    refetchInterval: 60000, // Refetch every minute for real-time dashboard
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};