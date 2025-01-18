import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export type SupabaseStatus = {
  status: 'connected' | 'disconnected';
  latency: number;
};

export function useSupabaseStatus(): SupabaseStatus {
  const supabase = useSupabaseClient();
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const checkConnection = async () => {
      const start = Date.now();
      try {
        await supabase.from('health_check').select('count').single();
        if (mounted) {
          setStatus('connected');
          setLatency(Date.now() - start);
        }
      } catch (error) {
        if (mounted) {
          setStatus('disconnected');
          setLatency(0);
        }
      }
    };

    checkConnection();
    interval = setInterval(checkConnection, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [supabase]);

  return { status, latency };
} 