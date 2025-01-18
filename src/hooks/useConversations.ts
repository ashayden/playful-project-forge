import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Conversation } from '@/types/chat';
import { logger } from '@/services/loggingService';

const CONVERSATIONS_KEY = 'conversations';

export function useConversations() {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: [CONVERSATIONS_KEY],
    queryFn: async () => {
      logger.debug('Fetching conversations');
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching conversations:', error);
        throw error;
      }

      return data as Conversation[];
    },
  });

  const createConversation = useMutation({
    mutationFn: async (title: string) => {
      logger.debug('Creating new conversation:', title);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert([{ 
          title,
          user_id: user.id,
          model: 'gpt-4-turbo-preview' // default model
        }])
        .select()
        .single();

      if (error) {
        logger.error('Error creating conversation:', error);
        throw error;
      }

      return data as Conversation;
    },
    onSuccess: (newConversation) => {
      queryClient.setQueryData<Conversation[]>([CONVERSATIONS_KEY], (old = []) => 
        [newConversation, ...old]
      );
    },
  });

  return {
    conversations,
    isLoading,
    error,
    createConversation: createConversation.mutate,
    isCreating: createConversation.isPending,
  };
}