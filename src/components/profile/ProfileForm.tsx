
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, User } from 'lucide-react';
import { ScooterModelSelector } from './ScooterModelSelector';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ScooterModel = Database['public']['Enums']['scooter_model'];

const profileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  scooter_models: z.array(z.enum(['450S', '450X', 'Rizta'])).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Profile {
  id: string;
  name?: string;
  email?: string;
  address?: string;
  mobile_number?: string;
  scooter_models?: ScooterModel[];
}

interface ProfileFormProps {
  profile?: Profile;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  isLoading?: boolean;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedModels, setSelectedModels] = useState<ScooterModel[]>(
    profile?.scooter_models || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      address: profile?.address || '',
      scooter_models: profile?.scooter_models || [],
    },
  });

  // Memoize profile values to prevent unnecessary re-renders
  const profileValues = useMemo(() => {
    if (!profile) return null;
    return {
      name: profile.name || '',
      email: profile.email || '',
      address: profile.address || '',
      scooter_models: profile.scooter_models || [],
    };
  }, [profile?.id, profile?.name, profile?.email, profile?.address, profile?.scooter_models]);

  // Update form when profile values actually change
  useEffect(() => {
    if (profileValues) {
      reset(profileValues);
      setSelectedModels(profileValues.scooter_models);
    }
  }, [profileValues, reset]);

  const handleModelSelectionChange = useCallback((models: ScooterModel[]) => {
    console.log('Scooter models selected:', models);
    setSelectedModels(models);
    setValue('scooter_models', models, {
      shouldDirty: true,
    });
  }, [setValue]);

  const onFormSubmit = async (data: ProfileFormData) => {
    console.log('Form submission data:', data);
    console.log('Selected models:', selectedModels);
    
    try {
      const formDataWithModels = {
        ...data,
        scooter_models: selectedModels,
      };
      
      console.log('Final form data being submitted:', formDataWithModels);
      await onSubmit(formDataWithModels);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <CardTitle className="text-2xl">Profile Settings</CardTitle>
        </div>
        <CardDescription>
          Update your personal information and scooter preferences. All fields are optional.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <CardContent className="space-y-6">
          {/* Mobile Number Display (Read-only) */}
          {profile?.mobile_number && (
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={profile.mobile_number}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Mobile number cannot be changed
              </p>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...register('name')}
              disabled={isLoading}
            />
            {errors.name && (
              <Alert variant="destructive">
                <AlertDescription>{errors.name.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <Alert variant="destructive">
                <AlertDescription>{errors.email.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Enter your address"
              rows={3}
              {...register('address')}
              disabled={isLoading}
            />
            {errors.address && (
              <Alert variant="destructive">
                <AlertDescription>{errors.address.message}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Scooter Models Selection */}
          <div className="space-y-2">
            <Label>Scooter Models</Label>
            <ScooterModelSelector
              selectedModels={selectedModels}
              onSelectionChange={handleModelSelectionChange}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Select the scooter models you own or are interested in
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading || !isDirty}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};
