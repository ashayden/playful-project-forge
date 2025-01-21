'use client';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Authentication may not work properly.');
}

// Create the Supabase client even if environment variables are missing
// This allows the app to load and show proper error messages
export const supabase = createClient<Database>(
  supabaseUrl ?? '',  // Fallback to empty string if undefined
  supabaseAnonKey ?? '',  // Fallback to empty string if undefined
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
); 