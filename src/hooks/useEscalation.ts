
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type EscalatedQuery = Database['public']['Tables']['escalated_queries']['Row'];
type EscalationPriority = Database['public']['Enums']['escalation_priority'];
type EscalationStatus = Database['public']['Enums']['escalation_status'];

export interface EscalationData {
  query: string;
  conversationId?: string;
  priority?: EscalationPriority;
  userId?: string;
}

// Create escalated query
export const useCreateEscalation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EscalationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: escalation, error } = await supabase
        .from('escalated_queries')
        .insert({
          query: data.query,
          conversation_id: data.conversationId,
          priority: data.priority || 'medium',
          user_id: data.userId || user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return escalation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalated-queries'] });
      toast.success('Query escalated successfully');
    },
    onError: (error) => {
      console.error('Escalation error:', error);
      toast.error('Failed to escalate query');
    },
  });
};

// Get escalated queries for admin
export const useEscalatedQueries = (status?: EscalationStatus) => {
  return useQuery({
    queryKey: ['escalated-queries', status],
    queryFn: async (): Promise<EscalatedQuery[]> => {
      let query = supabase
        .from('escalated_queries')
        .select(`
          *,
          profiles!escalated_queries_user_id_fkey (
            name,
            email,
            mobile_number
          ),
          chat_conversations (
            query,
            response,
            file_urls,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching escalated queries:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get escalated queries for current user
export const useUserEscalatedQueries = () => {
  return useQuery({
    queryKey: ['user-escalated-queries'],
    queryFn: async (): Promise<EscalatedQuery[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('escalated_queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user escalated queries:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
};

// Update escalated query (admin only)
export const useUpdateEscalation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<EscalatedQuery> 
    }) => {
      const { data, error } = await supabase
        .from('escalated_queries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalated-queries'] });
      toast.success('Query updated successfully');
    },
    onError: (error) => {
      console.error('Update escalation error:', error);
      toast.error('Failed to update query');
    },
  });
};

// Assign escalated query to admin
export const useAssignEscalation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, adminId }: { id: string; adminId: string }) => {
      const { data, error } = await supabase
        .from('escalated_queries')
        .update({
          assigned_admin_id: adminId,
          status: 'in_progress' as EscalationStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalated-queries'] });
      toast.success('Query assigned successfully');
    },
    onError: (error) => {
      console.error('Assign escalation error:', error);
      toast.error('Failed to assign query');
    },
  });
};

// Resolve escalated query with response
export const useResolveEscalation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      resolution, 
      adminNotes 
    }: { 
      id: string; 
      resolution: string; 
      adminNotes?: string 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('escalated_queries')
        .update({
          resolution,
          admin_notes: adminNotes,
          status: 'resolved' as EscalationStatus,
          resolved_at: new Date().toISOString(),
          assigned_admin_id: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalated-queries'] });
      toast.success('Query resolved successfully');
    },
    onError: (error) => {
      console.error('Resolve escalation error:', error);
      toast.error('Failed to resolve query');
    },
  });
};

// Get escalation statistics
export const useEscalationStats = () => {
  return useQuery({
    queryKey: ['escalation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalated_queries')
        .select('status, priority, created_at');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(q => q.status === 'pending').length || 0,
        in_progress: data?.filter(q => q.status === 'in_progress').length || 0,
        resolved: data?.filter(q => q.status === 'resolved').length || 0,
        closed: data?.filter(q => q.status === 'closed').length || 0,
        critical: data?.filter(q => q.priority === 'critical').length || 0,
        high: data?.filter(q => q.priority === 'high').length || 0,
        medium: data?.filter(q => q.priority === 'medium').length || 0,
        low: data?.filter(q => q.priority === 'low').length || 0,
      };

      return stats;
    },
    staleTime: 60 * 1000, // 1 minute
  });
};
