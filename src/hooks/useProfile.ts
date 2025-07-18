
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

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, return null
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: ProfileUpdateData): Promise<Profile> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Updating profile for user:', user.id, 'with data:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);
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
      console.error('Profile update mutation error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (profileData: ProfileUpdateData): Promise<Profile> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Creating profile for user:', user.id, 'with data:', profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          ...profileData,
        })
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        throw error;
      }

      console.log('Profile created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({
        title: "Profile Created",
        description: "Your profile has been successfully created.",
      });
    },
    onError: (error) => {
      console.error('Profile creation mutation error:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    },
  });
};
