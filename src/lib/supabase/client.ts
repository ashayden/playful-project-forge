'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> | null {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing.');
    return null;
  }

  try {
    supabaseInstance = createClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      }
    );
    return supabaseInstance;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
}

// Export a safe version of the Supabase client
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get: (_target, prop: keyof SupabaseClient<Database>) => {
    const client = getSupabaseClient();
    if (!client) {
      // Return a no-op function for methods
      return () => Promise.reject(new Error('Supabase client is not initialized'));
    }
    return client[prop];
  },
}); 