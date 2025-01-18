import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message, MessageSeverity } from '@/types/messages';
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

              // Update streaming state if needed
              if (payload.new.id === streamingMessageId && payload.new.is_streaming === false) {
                setStreamingMessageId(null);
              }
            }
            
            // Handle new messages
            if (payload.eventType === 'INSERT') {
              queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
                if (!old) return [payload.new as Message];
                // Find any temporary message to replace
                const tempIndex = old.findIndex(msg => 
                  msg.id?.startsWith('temp-') && 
                  msg.role === payload.new.role &&
                  msg.content === payload.new.content
                );
                
                if (tempIndex >= 0) {
                  // Replace temporary message
                  const newMessages = [...old];
                  newMessages[tempIndex] = payload.new as Message;
                  return newMessages;
                } else {
                  // Add new message
                  return [...old, payload.new as Message];
                }
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
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, role = 'user' }: { content: string; role?: Message['role'] }) => {
      logger.debug('Sending message:', { content, role, conversationId });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create optimistic user message
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        content,
        role,
        conversation_id: conversationId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        is_streaming: false
      };

      // Add optimistic message to cache
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      try {
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
          throw createError;
        }

        const userMessage = message as Message;

        // If it's a user message, get the AI response
        if (role === 'user') {
          // Create optimistic AI message
          const tempAiId = `temp-${Date.now()}-ai`;
          const optimisticAiMessage: Message = {
            id: tempAiId,
            content: '',
            role: 'assistant',
            conversation_id: conversationId,
            user_id: user.id,
            created_at: new Date().toISOString(),
            is_streaming: true
          };

          // Add optimistic AI message to cache
          queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
            return old ? [...old, optimisticAiMessage] : [optimisticAiMessage];
          });

          try {
            // Create a placeholder assistant message
            const { data: assistantMessage, error: assistantError } = await supabase
              .from('messages')
              .insert([{
                content: '',
                role: 'assistant',
                conversation_id: conversationId,
                user_id: user.id,
                is_streaming: true
              }])
              .select()
              .single();

            if (assistantError) {
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
                        throw updateError;
                      }

                      pendingContent = '';
                    }
                    batchTimeout = null;
                  }, 100);
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
                    severity: 'success' as MessageSeverity,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', streamingMessage.id);

                if (finalUpdateError) {
                  throw finalUpdateError;
                }

                // Clear streaming state
                setStreamingMessageId(null);
              },
              onError: async (error) => {
                // Clear streaming state and timeout
                setStreamingMessageId(null);
                if (batchTimeout) {
                  clearTimeout(batchTimeout);
                  batchTimeout = null;
                }

                // Update message with error
                const { error: updateError } = await supabase
                  .from('messages')
                  .update({ 
                    content: 'An error occurred while generating the response. Please try again.',
                    is_streaming: false,
                    severity: 'error' as MessageSeverity,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', streamingMessage.id);

                if (updateError) {
                  logger.error('Error updating message with error state:', updateError);
                }

                throw error;
              }
            });

            return {
              userMessage,
              assistantMessage: { ...streamingMessage, content: streamedContent }
            };
          } catch (error) {
            // Clear streaming state
            setStreamingMessageId(null);
            logger.error('Error processing message with AI:', error);
            throw error;
          }
        }

        return { userMessage };
      } catch (error) {
        // Update optimistic message with error state
        queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
          if (!old) return old;
          return old.map(msg => 
            msg.id === tempId 
              ? { ...msg, severity: 'error' as MessageSeverity }
              : msg
          );
        });
        throw error;
      }
    }
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

      // Remove message from cache
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
        if (!old) return old;
        return old.filter(msg => msg.id !== messageId);
      });
    }
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage: deleteMessage.mutateAsync,
    streamingMessageId,
    isStreaming: !!streamingMessageId,
    isSending: sendMessage.isPending
  };
} 