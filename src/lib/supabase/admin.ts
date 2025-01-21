import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Required environment variables for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing required environment variables for admin client:',
    !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
    !supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''
  );
}

// Create admin client with service role key
export const supabaseAdmin = createClient<Database>(
  supabaseUrl ?? '',
  supabaseServiceKey ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
); 