
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { useProfile, useUpsertProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Settings } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const upsertProfileMutation = useUpsertProfile();

  console.log('Profile page - User:', user?.id, 'Profile data:', profile, 'Loading:', isLoading, 'Error:', error);

  const handleProfileSubmit = async (formData: any) => {
    console.log('Profile form submitted:', formData);
    
    try {
      await upsertProfileMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Profile submission error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Profile page error:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load profile. Please try again.
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile Management</h1>
          <p className="text-muted-foreground">
            Manage your personal information and scooter preferences
          </p>
        </div>

        {/* Profile Form */}
        <ProfileForm
          profile={profile || undefined}
          onSubmit={handleProfileSubmit}
          isLoading={upsertProfileMutation.isPending}
        />

        {/* Profile Status Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <CardTitle className="text-lg">Account Status</CardTitle>
            </div>
            <CardDescription>
              Your account verification and profile status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Mobile Number</span>
              <span className="text-sm">
                {profile?.mobile_verified ? '✅ Verified' : '⚠️ Not Verified'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-medium">Profile Completion</span>
              <span className="text-sm">
                {profile?.name && profile?.scooter_models?.length ? '✅ Complete' : '⚠️ Incomplete'}
              </span>
            </div>

            {(!profile?.name || !profile?.scooter_models?.length) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Complete your profile to get personalized support and recommendations.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
