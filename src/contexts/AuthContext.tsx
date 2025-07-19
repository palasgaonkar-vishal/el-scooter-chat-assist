
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

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

  // Session timeout management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = () => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    if (user) {
      // Set warning timer
      warningRef.current = setTimeout(() => {
        toast({
          title: "Session Expiring Soon",
          description: "Your session will expire in 5 minutes due to inactivity.",
          variant: "destructive",
        });
      }, SESSION_TIMEOUT - WARNING_TIME);

      // Set timeout timer
      timeoutRef.current = setTimeout(async () => {
        toast({
          title: "Session Expired",
          description: "You have been signed out due to inactivity.",
          variant: "destructive",
        });
        await signOut();
      }, SESSION_TIMEOUT);
    }
  };

  const handleActivity = () => {
    resetTimer();
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to avoid blocking auth state changes
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();
              
              console.log('User profile role:', profile?.role);
              setIsAdmin(profile?.role === 'admin');
              setIsCustomer(profile?.role === 'customer');
            } catch (error) {
              console.error('Error fetching user profile:', error);
              // Default to customer role if profile fetch fails
              setIsAdmin(false);
              setIsCustomer(true);
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
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Session timeout effect
  useEffect(() => {
    if (user) {
      resetTimer();

      // Activity event listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (warningRef.current) {
          clearTimeout(warningRef.current);
        }
      };
    }
  }, [user]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with email:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sign in successful');
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log('Attempting to sign up with email:', email);
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
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
        console.error('Sign up error:', error);
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('Sign up successful:', data);
        if (!data.user?.email_confirmed_at) {
          toast({
            title: "Registration Successful",
            description: "Please check your email to verify your account.",
          });
        }
      }
      
      return { error };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error };
    }
  };

  const sendOTP = async (mobileNumber: string) => {
    try {
      console.log('Sending OTP to:', mobileNumber);
      
      // Generate OTP and store in database
      const { data: otpData, error: otpError } = await supabase.rpc('generate_otp');
      
      if (otpError) {
        console.error('OTP generation error:', otpError);
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
        console.error('OTP insert error:', insertError);
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
      console.log('Verifying OTP for:', mobileNumber, 'with OTP:', otp);
      
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
        console.error('OTP verification failed:', verifyError);
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

      // Create user account with proper email format for mobile customers
      const cleanNumber = mobileNumber.replace(/[^0-9]/g, '');
      const email = `${cleanNumber}@mobile.customer.ather.local`;
      const password = `mobile_${cleanNumber}_auth`;

      console.log('Creating user with email:', email);

      // Try to sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw signInError;
      }

      toast({
        title: "Login Successful",
        description: "Welcome to Ather Support!",
      });

      return { error: null };
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast({
        title: "Login Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
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
