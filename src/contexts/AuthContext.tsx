
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  sendOTP: (mobileNumber: string) => Promise<{ error: any }>;
  verifyOTP: (mobileNumber: string, otp: string, name?: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile to determine role
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              setIsAdmin(profile?.role === 'admin');
              setIsCustomer(profile?.role === 'customer');
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setIsCustomer(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name || '',
          }
        }
      });
      
      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account.",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const sendOTP = async (mobileNumber: string) => {
    try {
      // Generate OTP and store in database
      const { data: otpData, error: otpError } = await supabase.rpc('generate_otp');
      
      if (otpError) {
        throw otpError;
      }

      // Store OTP verification record
      const { error: insertError } = await supabase
        .from('otp_verifications')
        .insert({
          mobile_number: mobileNumber,
          otp_code: otpData,
        });

      if (insertError) {
        throw insertError;
      }

      // In production, this would send SMS via Twilio
      // For demo purposes, we'll show the OTP in console
      console.log(`OTP for ${mobileNumber}: ${otpData}`);
      
      toast({
        title: "OTP Sent",
        description: `OTP has been sent to ${mobileNumber}. Check console for demo OTP.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Send OTP error:', error);
      toast({
        title: "Failed to Send OTP",
        description: "Please try again later.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const verifyOTP = async (mobileNumber: string, otp: string, name?: string) => {
    try {
      // Verify OTP
      const { data: otpVerification, error: verifyError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('otp_code', otp)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (verifyError || !otpVerification) {
        toast({
          title: "Invalid OTP",
          description: "Please check your OTP and try again.",
          variant: "destructive",
        });
        return { error: verifyError || new Error('Invalid OTP') };
      }

      // Mark OTP as verified
      await supabase
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', otpVerification.id);

      // Create or sign in user with mobile number as email equivalent
      const email = `${mobileNumber.replace(/[^0-9]/g, '')}@mobile.local`;
      const password = `mobile_${mobileNumber}_${Date.now()}`;

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
            mobile_number: mobileNumber,
          }
        }
      });

      if (signUpError && !signUpError.message.includes('already registered')) {
        throw signUpError;
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      toast({
        title: "Login Successful",
        description: "Welcome to Ather Support!",
      });

      return { error: null };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign Out Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        sendOTP,
        verifyOTP,
        signOut,
        isAdmin,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
