import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { logger } from '@/services/loggingService';
import { ChatService } from '@/services/ai/ChatService';
import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

const MESSAGES_KEY = 'messages';

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const chatService = new ChatService();
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // Add realtime subscription
  useEffect(() => {
    let channel: RealtimeChannel;

    if (conversationId) {
      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            logger.debug('Realtime message update:', payload);
            
            // Handle message updates
            if (payload.eventType === 'UPDATE') {
              queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
                if (!old) return old;
                return old.map(msg => 
                  msg.id === payload.new.id 
                    ? { ...msg, ...payload.new }
                    : msg
                );
              });
            }
            
            // Handle new messages
            if (payload.eventType === 'INSERT') {
              queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
                if (!old) return [payload.new as Message];
                return [...old, payload.new as Message];
              });
            }
          }
        )
        .subscribe((status) => {
          logger.debug('Realtime subscription status:', status);
        });
    }

    return () => {
      if (channel) {
        logger.debug('Unsubscribing from realtime updates');
        channel.unsubscribe();
      }
    };
  }, [conversationId, queryClient]);

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: [MESSAGES_KEY, conversationId],
    queryFn: async () => {
      logger.debug('Fetching messages for conversation:', conversationId);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching messages:', error);
        throw error;
      }

      return (data || []) as Message[];
    },
    enabled: !!conversationId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, role = 'user' }: { content: string; role?: Message['role'] }) => {
      logger.debug('Sending message:', { content, role, conversationId });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create the user message in the database
      const { data: message, error: createError } = await supabase
        .from('messages')
        .insert([{
          content,
          role,
          conversation_id: conversationId,
          user_id: user.id,
        }])
        .select()
        .single();

      if (createError) {
        logger.error('Error creating message:', createError);
        throw createError;
      }

      const userMessage = message as Message;

      // If it's a user message, get the AI response
      if (role === 'user') {
        try {
          // Create a placeholder assistant message with streaming status
          const { data: assistantMessage, error: assistantError } = await supabase
            .from('messages')
            .insert([{
              content: '',
              role: 'assistant' as const,
              conversation_id: conversationId,
              user_id: user.id,
              is_streaming: true // Add streaming status
            }])
            .select()
            .single();

          if (assistantError) {
            logger.error('Error creating assistant message:', assistantError);
            throw assistantError;
          }

          if (!assistantMessage) {
            throw new Error('Failed to create assistant message');
          }

          const streamingMessage = assistantMessage as Message & { id: string };
          let streamedContent = '';
          let batchedContent = '';
          let updateTimeout: NodeJS.Timeout;
          
          // Set streaming state
          setStreamingMessageId(streamingMessage.id);

          // Batch update function
          const updateMessageContent = async (content: string, isComplete = false) => {
            try {
              const { error: updateError } = await supabase
                .from('messages')
                .update({ 
                  content,
                  is_streaming: !isComplete
                })
                .eq('id', streamingMessage.id);

              if (updateError) {
                logger.error('Error updating streaming message:', updateError);
                throw updateError;
              }
            } catch (error) {
              logger.error('Error in batch update:', error);
            }
          };

          // Prepare messages for AI processing
          const messagesForAI = [...messages, userMessage].map(msg => ({
            ...msg,
            content: msg.content ?? '',
            id: msg.id ?? '',
          }));

          // Process the message with streaming
          await chatService.processMessageStream(messagesForAI, {
            onToken: async (token: string) => {
              streamedContent += token;
              batchedContent += token;

              // Batch updates
              if (updateTimeout) clearTimeout(updateTimeout);
              updateTimeout = setTimeout(() => {
                updateMessageContent(streamedContent);
                batchedContent = '';
              }, 100); // Batch updates every 100ms
            },
            onComplete: async () => {
              // Clear streaming state
              setStreamingMessageId(null);
              
              // Final update
              await updateMessageContent(streamedContent, true);

              // Clear any pending updates
              if (updateTimeout) {
                clearTimeout(updateTimeout);
              }
            },
            onError: (error) => {
              // Clear streaming state and timeout on error
              setStreamingMessageId(null);
              if (updateTimeout) {
                clearTimeout(updateTimeout);
              }
              logger.error('Error in streaming:', error);
              throw error;
            }
          });

          return {
            userMessage,
            assistantMessage: { ...streamingMessage, content: streamedContent }
          };
        } catch (error) {
          // Clear streaming state on error
          setStreamingMessageId(null);
          logger.error('Error processing message with AI:', error);
          throw error;
        }
      }

      return { userMessage };
    },
    onMutate: async ({ content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [MESSAGES_KEY, conversationId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>([MESSAGES_KEY, conversationId]);

      // Create optimistic user message
      const optimisticUserMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        conversation_id: conversationId,
        user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
        created_at: new Date().toISOString(),
      };

      // Create optimistic assistant message
      const optimisticAssistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        conversation_id: conversationId,
        user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
        created_at: new Date().toISOString(),
      };

      // Optimistically update the messages
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => [
        ...(old || []),
        optimisticUserMessage,
        optimisticAssistantMessage,
      ]);

      return { previousMessages, optimisticUserMessage, optimisticAssistantMessage };
    },
    onError: (err, _variables, context) => {
      logger.error('Error in message mutation:', err);
      // Revert back to the previous state if there's an error
      if (context?.previousMessages) {
        queryClient.setQueryData([MESSAGES_KEY, conversationId], context.previousMessages);
      }
    },
    onSuccess: (data, _variables, context) => {
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
        const messages = [...(old || [])];
        // Remove optimistic messages
        const filteredMessages = messages.filter(
          msg => msg.id !== context?.optimisticUserMessage.id && 
                 msg.id !== context?.optimisticAssistantMessage?.id
        );
        // Add real messages
        const newMessages = [...filteredMessages];
        if (data.userMessage) {
          newMessages.push(data.userMessage);
        }
        if (data.assistantMessage) {
          newMessages.push(data.assistantMessage);
        }
        return newMessages;
      });
      // Invalidate and refetch after successful mutation
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, conversationId] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    streamingMessageId,
    isStreaming: !!streamingMessageId,
  };
} 