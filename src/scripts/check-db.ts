import { supabase } from '@/lib/supabase/client';

async function checkDatabase() {
  try {
    // Check conversations table
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (convError) {
      console.error('Error checking conversations table:', convError);
    } else {
      console.log('✅ Conversations table exists');
    }

    // Check messages table
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (msgError) {
      console.error('Error checking messages table:', msgError);
    } else {
      console.log('✅ Messages table exists');
    }

    // Check RLS policies
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies');

    if (policyError) {
      console.error('Error checking policies:', policyError);
    } else {
      console.log('✅ RLS policies:', policies);
    }

  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabase(); 