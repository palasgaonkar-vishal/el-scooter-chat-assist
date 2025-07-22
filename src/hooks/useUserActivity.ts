import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface UserActivity {
  id: string;
  type: 'chat' | 'order' | 'escalation';
  title: string;
  description: string;
  date: string;
  status?: string;
}

export const useUserActivity = () => {
  return useQuery({
    queryKey: ['user-activity'],
    queryFn: async (): Promise<UserActivity[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const activities: UserActivity[] = [];

      // Get recent chat conversations
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (conversations) {
        conversations.forEach(conv => {
          activities.push({
            id: conv.id,
            type: 'chat',
            title: 'Chat Conversation',
            description: conv.query.length > 60 ? `${conv.query.substring(0, 60)}...` : conv.query,
            date: format(new Date(conv.created_at), 'MMM dd, HH:mm'),
            status: conv.escalated ? 'escalated' : 'completed'
          });
        });
      }

      // Get recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (orders) {
        orders.forEach(order => {
          activities.push({
            id: order.id,
            type: 'order',
            title: `Order ${order.order_number}`,
            description: `${order.scooter_model} - ${order.status}`,
            date: format(new Date(order.created_at), 'MMM dd, HH:mm'),
            status: order.status
          });
        });
      }

      // Get recent escalations
      const { data: escalations } = await supabase
        .from('escalated_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (escalations) {
        escalations.forEach(escalation => {
          activities.push({
            id: escalation.id,
            type: 'escalation',
            title: 'Escalated Query',
            description: escalation.query.length > 60 ? `${escalation.query.substring(0, 60)}...` : escalation.query,
            date: format(new Date(escalation.created_at), 'MMM dd, HH:mm'),
            status: escalation.status
          });
        });
      }

      // Sort by date (most recent first)
      return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    },
    staleTime: 30000, // Cache for 30 seconds
  });
};