import { useContext, useCallback } from 'react';
import { ChatContext, ChatContextType } from '../contexts/ChatContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Conversation } from '@/types/chat';
import { logger } from '@/services/loggingService';

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  const queryClient = useQueryClient();

  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  const clearAllConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        logger.error('Error clearing conversations:', error);
        throw error;
      }

      // Invalidate and refetch conversations
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      logger.error('Failed to clear conversations:', error);
      throw error;
    }
  }, [queryClient]);

  return {
    ...context,
    clearAllConversations,
  };
} 