import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/messages';
import { logger } from '@/services/loggingService';
import { useConversations } from './useConversations';

const MESSAGES_KEY = 'messages';

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const { updateConversation } = useConversations();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: [MESSAGES_KEY, conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      logger.debug('Fetching messages for conversation:', conversationId);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching messages:', error);
        throw error;
      }

      return data as Message[];
    },
    enabled: !!conversationId,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      logger.debug('Sending message:', content);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Insert user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert([{
          content,
          role: 'user',
          conversation_id: conversationId,
          user_id: user.id
        }])
        .select()
        .single();

      if (userError) {
        logger.error('Error sending user message:', userError);
        throw userError;
      }

      // Simulate AI response (replace with actual AI call)
      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
        .insert([{
          content: 'This is a simulated AI response.',
          role: 'assistant',
          conversation_id: conversationId,
          user_id: user.id
        }])
        .select()
        .single();

      if (aiError) {
        logger.error('Error sending AI message:', aiError);
        throw aiError;
      }

      // Mark conversation as having a response
      await updateConversation({ id: conversationId, hasResponse: true });

      return [userMessage, aiMessage] as Message[];
    },
    onSuccess: (newMessages) => {
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
        const messages = [...(old || [])];
        return [...messages, ...newMessages];
      });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      logger.debug('Deleting message:', messageId);
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        logger.error('Error deleting message:', error);
        throw error;
      }
    },
    onSuccess: (_, messageId) => {
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
        if (!old) return old;
        return old.filter(message => message.id !== messageId);
      });
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: async (content: string) => {
      await sendMessage.mutateAsync({ content });
    },
    deleteMessage: async (messageId: string) => {
      await deleteMessage.mutateAsync(messageId);
    },
    isSending: sendMessage.isPending,
    isStreaming: false, // TODO: Implement streaming
    streamingMessageId: null, // TODO: Implement streaming
  };
} 