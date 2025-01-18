import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/loggingService';

interface SupabaseStatus {
  isConnected: boolean;
  latency: number;
}

export function useSupabaseStatus(): SupabaseStatus {
  const [isConnected, setIsConnected] = useState(true);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    let mounted = true;
    let pingInterval: NodeJS.Timeout;
    let channel: RealtimeChannel;

    const checkConnection = async () => {
      try {
        const start = Date.now();
        const { error } = await supabase.from('messages').select('count', { count: 'exact', head: true });
        const end = Date.now();
        
        if (mounted) {
          setIsConnected(!error);
          setLatency(end - start);
        }

        if (error) {
          logger.warn('Connection check failed:', error.message);
        }
      } catch (error) {
        if (mounted) {
          setIsConnected(false);
          setLatency(0);
        }
        logger.error('Connection check error:', error);
      }
    };

    const setupRealtimeSubscription = () => {
      channel = supabase.channel('system_health');
      channel
        .subscribe((status) => {
          if (mounted) {
            setIsConnected(status === 'SUBSCRIBED');
            logger.debug('Realtime subscription status:', status);
          }
        });
    };

    // Initial setup
    checkConnection();
    setupRealtimeSubscription();

    // Set up periodic checks
    pingInterval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => {
      mounted = false;
      clearInterval(pingInterval);
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  return { isConnected, latency };
} 