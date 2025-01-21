'use client';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Ensure environment variables are available
if (
  typeof window !== 'undefined' &&
  !window.process?.env?.NEXT_PUBLIC_SUPABASE_URL &&
  !window.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn('Environment variables not found in window.process.env, checking process.env directly');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  throw new Error(
    'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
); 