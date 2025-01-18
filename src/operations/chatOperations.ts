import { Message } from '@/types/messages';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/loggingService';

type CreateMessageParams = {
  content: string;
  role: 'user' | 'assistant' | 'system';
  conversation_id: string;
  user_id: string;
};

export async function createMessage(params: CreateMessageParams): Promise<Message> {
  logger.debug('Creating message:', params);

  const { data, error } = await supabase
    .from('messages')
    .insert([params])
    .select()
    .single();

  if (error) {
    logger.error('Error creating message:', error);
    throw error;
  }

  return data as Message;
}