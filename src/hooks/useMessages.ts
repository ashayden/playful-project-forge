import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/messages';
import { logger } from '@/services/loggingService';
import { useConversations } from './useConversations';
import { ChatService } from '@/services/ai/ChatService';
import { useState } from 'react';

const MESSAGES_KEY = 'messages';
const chatService = new ChatService();

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const { updateConversation } = useConversations();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

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

      // Create empty assistant message
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert([{
          content: '',
          role: 'assistant',
          conversation_id: conversationId,
          user_id: null
        }])
        .select()
        .single();

      if (assistantError) {
        logger.error('Error creating assistant message:', assistantError);
        throw assistantError;
      }

      setIsStreaming(true);
      setStreamingMessageId(assistantMessage.id);

      try {
        let streamedContent = '';
        
        // Get all messages for context
        const { data: messageHistory } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        // Process message with streaming
        await chatService.processMessageStream(
          messageHistory || [],
          {
            onToken: async (token) => {
              streamedContent += token;
              // Update message in real-time
              await supabase
                .from('messages')
                .update({ content: streamedContent })
                .eq('id', assistantMessage.id);
            },
            onComplete: async () => {
              setIsStreaming(false);
              setStreamingMessageId(null);
              // Mark conversation as having a response
              await updateConversation({ id: conversationId, hasResponse: true });
            },
            onError: (error) => {
              logger.error('Error in AI stream:', error);
              throw error;
            }
          }
        );

        return [userMessage, { ...assistantMessage, content: streamedContent }] as Message[];
      } catch (error) {
        logger.error('Error in streaming response:', error);
        // Update message with error
        await supabase
          .from('messages')
          .update({
            content: 'Sorry, I encountered an error while processing your request. Please try again.',
          })
          .eq('id', assistantMessage.id);

        setIsStreaming(false);
        setStreamingMessageId(null);
        throw error;
      }
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
    isStreaming,
    streamingMessageId,
  };
} 