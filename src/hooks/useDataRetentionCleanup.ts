import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDataRetentionCleanup = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('analytics-cleanup');
      
      if (error) {
        throw new Error(error.message || 'Failed to run cleanup');
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Data Cleanup Completed",
        description: `Cleaned up analytics data successfully`,
      });
      console.log('Data cleanup completed:', data);
    },
    onError: (error) => {
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
      console.error('Data cleanup failed:', error);
    },
  });
};