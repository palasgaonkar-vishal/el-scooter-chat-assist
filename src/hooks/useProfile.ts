import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ScooterModel = Database['public']['Enums']['scooter_model'];

interface Profile {
  id: string;
  name?: string;
  email?: string;
  address?: string;
  mobile_number?: string;
  scooter_models?: ScooterModel[];
  mobile_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProfileUpdateData {
  name?: string;
  email?: string;
  address?: string;
  scooter_models?: ScooterModel[];
}

export const useProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;

      console.log('Fetching profile for user:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }

      console.log('Profile fetched:', data);
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpsertProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: ProfileUpdateData): Promise<Profile> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Upserting profile for user:', user.id, 'with data:', profileData);

      // Use upsert to handle both create and update scenarios
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...profileData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Profile upsert error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from profile upsert');
      }

      console.log('Profile upserted successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Profile upsert mutation error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Keep the old hooks for backward compatibility but mark as deprecated
export const useUpdateProfile = () => {
  console.warn('useUpdateProfile is deprecated, use useUpsertProfile instead');
  return useUpsertProfile();
};

export const useCreateProfile = () => {
  console.warn('useCreateProfile is deprecated, use useUpsertProfile instead');
  return useUpsertProfile();
};
