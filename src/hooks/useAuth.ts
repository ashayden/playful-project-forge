import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/loggingService';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First get the initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (mounted) {
          setSession(initialSession);
          // Keep loading true until we set up the subscription
        }

        // Then set up the subscription for future changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          logger.debug('Auth state changed:', { event: _event, session });
          if (mounted) {
            setSession(session);
            setIsLoading(false);
          }
        });

        // Only set loading to false after both initial session and subscription are set up
        if (mounted) {
          setIsLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        logger.error('Failed to initialize auth:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize auth'));
          setIsLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();

    return () => {
      mounted = false;
      cleanup?.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  return {
    session,
    isLoading,
    error,
    user: session?.user ?? null,
  };
} 