
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export const useSessionTimeout = () => {
  const { user, signOut } = useAuth();
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

  return { resetTimer };
};
