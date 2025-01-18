import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/messages';
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
                const updatedMessages = old.map(msg => 
                  msg.id === payload.new.id 
                    ? { ...msg, ...payload.new }
                    : msg
                );
                // Remove any optimistic messages for this conversation
                return updatedMessages.filter(msg => !msg.id?.startsWith('temp-'));
              });

              // Update streaming state if needed
              if (payload.new.id === streamingMessageId && payload.new.is_streaming === false) {
                setStreamingMessageId(null);
              }
            }
            
            // Handle new messages
            if (payload.eventType === 'INSERT') {
              queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
                if (!old) return [payload.new as Message];
                // Remove any optimistic messages and add the new message
                const messages = old.filter(msg => !msg.id?.startsWith('temp-'));
                const exists = messages.some(msg => msg.id === payload.new.id);
                if (!exists) {
                  return [...messages, payload.new as Message];
                }
                return messages;
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
  }, [conversationId, queryClient, streamingMessageId]);

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
    staleTime: 10000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false, // Disable automatic refetch
    refetchOnReconnect: false, // Rely on realtime updates instead
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
          is_streaming: false
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
              is_streaming: true
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
          let batchTimeout: NodeJS.Timeout | null = null;
          let pendingContent = '';
          
          // Set streaming state
          setStreamingMessageId(streamingMessage.id);

          // Process the message with streaming
          await chatService.processMessageStream(messages, {
            onToken: async (token: string) => {
              pendingContent += token;
              
              // Batch updates to reduce database writes
              if (!batchTimeout) {
                batchTimeout = setTimeout(async () => {
                  if (pendingContent) {
                    streamedContent += pendingContent;
                    
                    // Update the message content in the database
                    const { error: updateError } = await supabase
                      .from('messages')
                      .update({ 
                        content: streamedContent,
                        is_streaming: true,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', streamingMessage.id);

                    if (updateError) {
                      logger.error('Error updating streaming message:', updateError);
                      throw updateError;
                    }

                    pendingContent = '';
                  }
                  batchTimeout = null;
                }, 100); // Batch updates every 100ms
              }
            },
            onComplete: async () => {
              // Clear any pending timeout
              if (batchTimeout) {
                clearTimeout(batchTimeout);
                batchTimeout = null;
              }

              // Final update with complete content
              const finalContent = streamedContent + pendingContent;
              const { error: finalUpdateError } = await supabase
                .from('messages')
                .update({ 
                  content: finalContent,
                  is_streaming: false,
                  updated_at: new Date().toISOString()
                })
                .eq('id', streamingMessage.id);

              if (finalUpdateError) {
                logger.error('Error finalizing streaming message:', finalUpdateError);
                throw finalUpdateError;
              }

              // Clear streaming state
              setStreamingMessageId(null);
            },
            onError: (error) => {
              // Clear streaming state and timeout on error
              setStreamingMessageId(null);
              if (batchTimeout) {
                clearTimeout(batchTimeout);
                batchTimeout = null;
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
        is_streaming: false
      };

      // Optimistically update the messages
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
        const messages = [...(old || [])];
        // Remove any existing optimistic messages
        const filteredMessages = messages.filter(msg => msg.id && !msg.id.startsWith('temp-'));
        return [...filteredMessages, optimisticUserMessage];
      });

      return { previousMessages, optimisticUserMessage };
    },
    onError: (err, _variables, context) => {
      logger.error('Error in message mutation:', err);
      // Revert back to the previous state if there's an error
      if (context?.previousMessages) {
        queryClient.setQueryData([MESSAGES_KEY, conversationId], context.previousMessages);
      }
    },
    onSuccess: (data, _variables) => {
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
        if (!old) return old;
        // Remove optimistic messages and add real ones
        const messages = old.filter(msg => msg.id && !msg.id.startsWith('temp-'));
        if (data.userMessage) {
          messages.push(data.userMessage);
        }
        return messages;
      });
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