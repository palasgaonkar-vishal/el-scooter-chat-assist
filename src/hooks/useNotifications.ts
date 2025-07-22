import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface EscalationNotification {
  id: string;
  query: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
  user_id: string;
  status: 'pending' | 'in_progress' | 'resolved';
}

export interface AdminResolutionNotification {
  id: string;
  escalation_id: string;
  query: string;
  resolution: string;
  resolved_at: string;
}

// Hook for admin notifications about new escalations
export const useAdminEscalationNotifications = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [newEscalationCount, setNewEscalationCount] = useState(0);

  // Fetch pending escalations count
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-escalations-count'],
    queryFn: async () => {
      if (!isAdmin) return 0;
      
      const { count, error } = await supabase
        .from('escalated_queries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  useEffect(() => {
    if (!isAdmin) return;

    console.log('Setting up escalation notifications for admin');

    // Subscribe to real-time changes on escalated_queries
    const channel = supabase
      .channel('escalation-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'escalated_queries'
        },
        (payload) => {
          console.log('New escalation received:', payload);
          const newEscalation = payload.new as EscalationNotification;
          
          // Show toast notification
          toast(`New ${newEscalation.priority} priority escalation`, {
            description: `Query: ${newEscalation.query.substring(0, 100)}...`,
            action: {
              label: "View",
              onClick: () => window.location.href = "/admin/escalated-queries"
            },
          });

          // Update counts
          setNewEscalationCount(prev => prev + 1);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['pending-escalations-count'] });
          queryClient.invalidateQueries({ queryKey: ['escalated-queries'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'escalated_queries'
        },
        (payload) => {
          console.log('Escalation updated:', payload);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['pending-escalations-count'] });
          queryClient.invalidateQueries({ queryKey: ['escalated-queries'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up escalation notifications');
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  const clearNewEscalationCount = () => {
    setNewEscalationCount(0);
  };

  return {
    pendingCount,
    newEscalationCount,
    clearNewEscalationCount,
  };
};

// Hook for customer notifications about admin responses
export const useCustomerResolutionNotifications = () => {
  const { user, isCustomer } = useAuth();
  const queryClient = useQueryClient();
  const [unreadResolutions, setUnreadResolutions] = useState<AdminResolutionNotification[]>([]);

  useEffect(() => {
    if (!isCustomer || !user) return;

    console.log('Setting up resolution notifications for customer');

    // Subscribe to escalated_queries updates for this user
    const channel = supabase
      .channel(`user-resolutions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'escalated_queries',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Escalation resolution received:', payload);
          const updated = payload.new as any;
          
          // Only notify if status changed to resolved and we have a resolution
          if (updated.status === 'resolved' && updated.resolution) {
            const notification: AdminResolutionNotification = {
              id: updated.id,
              escalation_id: updated.id,
              query: updated.query,
              resolution: updated.resolution,
              resolved_at: updated.resolved_at,
            };

            // Show toast notification
            toast('Your query has been resolved!', {
              description: `${updated.resolution.substring(0, 100)}...`,
              action: {
                label: "View",
                onClick: () => window.location.href = "/customer/chat"
              },
            });

            setUnreadResolutions(prev => [...prev, notification]);
            
            // Invalidate user escalations query
            queryClient.invalidateQueries({ queryKey: ['user-escalated-queries'] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up resolution notifications');
      supabase.removeChannel(channel);
    };
  }, [isCustomer, user, queryClient]);

  const markResolutionAsRead = (resolutionId: string) => {
    setUnreadResolutions(prev => prev.filter(r => r.id !== resolutionId));
  };

  const clearAllResolutions = () => {
    setUnreadResolutions([]);
  };

  return {
    unreadResolutions,
    markResolutionAsRead,
    clearAllResolutions,
  };
};