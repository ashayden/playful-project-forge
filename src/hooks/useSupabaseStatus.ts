import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSupabaseStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    let mounted = true;
    let pingInterval: NodeJS.Timeout;

    const checkConnection = async () => {
      try {
        const start = Date.now();
        // Simple ping using a lightweight query
        const { data, error } = await supabase.from('messages').select('count', { count: 'exact', head: true });
        const end = Date.now();
        
        if (mounted) {
          setIsConnected(!error);
          setLatency(end - start);
        }
      } catch (error) {
        if (mounted) {
          setIsConnected(false);
          setLatency(0);
        }
      }
    };

    // Initial check
    checkConnection();

    // Set up periodic checks
    pingInterval = setInterval(checkConnection, 30000); // Check every 30 seconds

    // Subscribe to realtime presence
    const channel = supabase.channel('system_health');
    channel
      .subscribe((status) => {
        if (mounted) {
          setIsConnected(status === 'SUBSCRIBED');
        }
      });

    return () => {
      mounted = false;
      clearInterval(pingInterval);
      channel.unsubscribe();
    };
  }, []);

  return { isConnected, latency };
} 