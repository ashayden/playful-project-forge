import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { logger } from '@/services/loggingService';
import { AIService } from '@/services/ai/AIService';

const MESSAGES_KEY = 'messages';

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const aiService = new AIService();

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
  });

  const sendMessage = useMutation({
    mutationFn: async ({ content, role = 'user' }: { content: string; role?: Message['role'] }) => {
      logger.debug('Sending message:', { content, role, conversationId });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create the message in the database
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
          // Prepare messages for AI processing
          const messagesForAI = [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          const aiResponse = await aiService.processMessage(messagesForAI);
          
          // Create the assistant message
          const { data: assistantMessage, error: assistantError } = await supabase
            .from('messages')
            .insert([{
              content: aiResponse,
              role: 'assistant' as const,
              conversation_id: conversationId,
              user_id: user.id,
            }])
            .select()
            .single();

          if (assistantError) {
            logger.error('Error creating assistant message:', assistantError);
            throw assistantError;
          }

          return {
            userMessage,
            assistantMessage: assistantMessage as Message
          };
        } catch (error) {
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
        id: `temp-${Date.now()}-assistant`,
        role: 'assistant',
        content: 'Thinking...',
        conversation_id: conversationId,
        user_id: null,
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
    onError: (err, variables, context) => {
      logger.error('Error in message mutation:', err);
      // Revert back to the previous state if there's an error
      if (context?.previousMessages) {
        queryClient.setQueryData([MESSAGES_KEY, conversationId], context.previousMessages);
      }
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<Message[]>([MESSAGES_KEY, conversationId], old => {
        const messages = [...(old || [])];
        // Remove optimistic messages
        const filteredMessages = messages.filter(
          msg => msg.id !== context?.optimisticUserMessage.id && 
                 msg.id !== context?.optimisticAssistantMessage.id
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
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
} 