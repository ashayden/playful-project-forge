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
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Add subscription management
  const setupRealtimeSubscription = () => {
    if (channel) {
      channel.unsubscribe();
    }

    // Create new subscription
    const newChannel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          logger.debug('Realtime message update:', payload);
          
          // Handle message updates
          const updatedMessage = payload.new as Message;
          queryClient.setQueryData<Message[]>(['messages', conversationId], (old) => {
            if (!old) return [updatedMessage];
            
            // Check for temporary messages to replace
            if (payload.eventType === 'INSERT') {
              const tempIndex = old.findIndex(msg => 
                msg.id?.startsWith('temp-') && 
                msg.role === updatedMessage.role &&
                msg.content === updatedMessage.content
              );
              
              if (tempIndex >= 0) {
                // Replace temporary message
                const updated = [...old];
                updated[tempIndex] = updatedMessage;
                logger.debug('Replaced temp message:', {
                  tempId: old[tempIndex].id,
                  newId: updatedMessage.id
                });
                return updated;
              }
            }
            
            // Update existing message or add new one
            const index = old.findIndex(msg => msg.id === updatedMessage.id);
            if (index === -1) {
              // Avoid duplicates by checking content and role
              const isDuplicate = old.some(msg => 
                !msg.id?.startsWith('temp-') && 
                msg.role === updatedMessage.role && 
                msg.content === updatedMessage.content &&
                msg.conversation_id === updatedMessage.conversation_id
              );
              
              if (!isDuplicate) {
                logger.debug('Adding new message:', updatedMessage.id);
                return [...old, updatedMessage];
              }
              return old;
            }
            
            const updated = [...old];
            updated[index] = updatedMessage;
            return updated;
          });
        }
      )
      .subscribe((status) => {
        logger.debug('Realtime subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          logger.info('Successfully subscribed to message updates');
        }
        
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          logger.warn('Realtime subscription closed or errored, attempting to reconnect...');
          setTimeout(setupRealtimeSubscription, 1000); // Retry after 1 second
        }
      });

    setChannel(newChannel);
  };

  // Set up subscription when conversation ID changes
  useEffect(() => {
    if (!conversationId) return;
    
    setupRealtimeSubscription();
    
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [conversationId]);

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
        is_streaming: false,
        severity: 'info' as MessageSeverity
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
            is_streaming: false,
            severity: 'info'
          }])
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        const userMessage = message as Message;

        // If it's a user message, get the AI response
        if (role === 'user') {
          // Get existing messages for context
          const existingMessages = queryClient.getQueryData<Message[]>([MESSAGES_KEY, conversationId]) || [];
          
          // Filter out temporary messages and ensure we have valid messages
          const validMessages = existingMessages.filter(msg => 
            msg && msg.id && !msg.id.startsWith('temp-') && 
            msg.role && typeof msg.content === 'string' &&
            !msg.is_streaming // Filter out any messages that are still streaming
          );

          logger.debug('Processing message with context:', {
            messageCount: validMessages.length,
            newMessage: { content, role },
            streamingMessageId
          });

          // Create optimistic AI message
          const tempAiId = `temp-${Date.now()}-ai`;
          const optimisticAiMessage: Message = {
            id: tempAiId,
            content: '',
            role: 'assistant',
            conversation_id: conversationId,
            user_id: user.id,
            created_at: new Date().toISOString(),
            is_streaming: true,
            severity: 'info' as MessageSeverity
          };

          // Add optimistic AI message to cache
          queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
            return old ? [...old, optimisticAiMessage] : [optimisticAiMessage];
          });

          let isStreaming = true;
          let batchTimeout: NodeJS.Timeout | null = null;

          // Define cleanup function
          const cleanupStreamingState = () => {
            setStreamingMessageId(null);
            if (batchTimeout) {
              clearTimeout(batchTimeout);
              batchTimeout = null;
            }
            isStreaming = false;
          };

          try {
            // Create a placeholder assistant message
            const { data: assistantMessage, error: assistantError } = await supabase
              .from('messages')
              .insert([{
                content: '',
                role: 'assistant',
                conversation_id: conversationId,
                user_id: user.id,
                is_streaming: true,
                severity: 'info'
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
            let pendingContent = '';
            
            // Clear any existing streaming state
            if (streamingMessageId) {
              logger.debug('Clearing previous streaming state:', streamingMessageId);
              setStreamingMessageId(null);
            }
            
            // Set new streaming state
            setStreamingMessageId(streamingMessage.id);

            // Process the message with streaming
            await chatService.processMessageStream([...validMessages, userMessage], {
              onToken: async (token: string) => {
                if (!isStreaming) return; // Skip if we're no longer streaming
                pendingContent += token;
                
                // Batch updates to reduce database writes
                if (!batchTimeout) {
                  batchTimeout = setTimeout(async () => {
                    if (pendingContent && isStreaming) {
                      try {
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
                          cleanupStreamingState();
                          throw updateError;
                        }

                        pendingContent = '';
                      } catch (error) {
                        logger.error('Error in batch update:', error);
                        cleanupStreamingState();
                        throw error;
                      }
                    }
                    batchTimeout = null;
                  }, 100);
                }
              },
              onComplete: async () => {
                try {
                  // Clear any pending timeout
                  cleanupStreamingState();

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
                    logger.error('Error in final update:', finalUpdateError);
                    throw finalUpdateError;
                  }
                } catch (error) {
                  logger.error('Error in onComplete:', error);
                  throw error;
                }
              },
              onError: async (error) => {
                // Clear streaming state and timeout
                cleanupStreamingState();

                try {
                  // Update message with error
                  const { error: updateError } = await supabase
                    .from('messages')
                    .update({ 
                      content: 'An error occurred while generating the response. Please try again.',
                      is_streaming: false,
                      updated_at: new Date().toISOString(),
                      severity: 'error'
                    })
                    .eq('id', streamingMessage.id);

                  if (updateError) {
                    logger.error('Error updating message with error state:', updateError);
                  }
                } catch (updateError) {
                  logger.error('Error in error handling:', updateError);
                }

                throw error;
              }
            });

            return {
              userMessage,
              assistantMessage: { ...streamingMessage, content: streamedContent }
            };
          } catch (error) {
            cleanupStreamingState();
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