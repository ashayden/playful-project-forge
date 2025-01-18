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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching conversations:', error);
        throw error;
      }

      return (data || []).map(conv => ({
        ...conv,
        has_response: conv.has_response ?? false,
        model: 'gpt-4o'
      })) as Conversation[];
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 30000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const createConversation = useMutation({
    mutationFn: async (title: string) => {
      logger.debug('Creating conversation:', title);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          title,
          user_id: user.id,
          model: 'gpt-4o',
          has_response: false
        }])
        .select()
        .single();

      if (error) {
        logger.error('Error creating conversation:', error);
        throw error;
      }

      const newConversation = {
        ...data,
        has_response: false,
        model: 'gpt-4o'
      } as Conversation;

      return newConversation;
    },
    onSuccess: (newConversation) => {
      queryClient.setQueryData<Conversation[]>([CONVERSATIONS_KEY], old => {
        const conversations = [...(old || [])];
        return [newConversation, ...conversations];
      });
    },
  });

  const updateConversation = useMutation({
    mutationFn: async ({ id, title, hasResponse }: { id: string; title?: string; hasResponse?: boolean }) => {
      logger.debug('Updating conversation:', { id, title, hasResponse });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (hasResponse !== undefined) updates.has_response = hasResponse;

      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating conversation:', error);
        throw error;
      }

      return {
        ...data,
        has_response: data.has_response ?? false,
        model: 'gpt-4o'
      } as Conversation;
    },
    onSuccess: (updatedConversation) => {
      queryClient.setQueryData<Conversation[]>([CONVERSATIONS_KEY], old => {
        if (!old) return old;
        return old.map(conversation => 
          conversation.id === updatedConversation.id ? updatedConversation : conversation
        );
      });
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      logger.debug('Deleting conversation:', conversationId);
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        logger.error('Error deleting conversation:', error);
        throw error;
      }
    },
    onSuccess: (_, conversationId) => {
      queryClient.setQueryData<Conversation[]>([CONVERSATIONS_KEY], old => {
        if (!old) return old;
        return old.filter(conversation => conversation.id !== conversationId);
      });
    },
  });

  return {
    conversations,
    isLoading,
    error,
    createConversation: async (title: string) => {
      const result = await createConversation.mutateAsync(title);
      return result;
    },
    isCreating: createConversation.isPending,
    updateConversation: async (params: { id: string; title?: string; hasResponse?: boolean }) => {
      await updateConversation.mutateAsync(params);
    },
    isUpdating: updateConversation.isPending,
    deleteConversation: async (id: string) => {
      await deleteConversation.mutateAsync(id);
    },
    isDeleting: deleteConversation.isPending,
  };
}