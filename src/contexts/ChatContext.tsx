import { createContext, ReactNode, useState, useEffect } from 'react';
import { Message } from '@/types/messages';
import { Conversation } from '@/types/chat';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/loggingService';
import { supabase } from '@/integrations/supabase/client';

export type ChatContextType = {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  createConversation: (title: string) => Promise<Conversation>;
  isCreating: boolean;
  updateConversation: (params: { id: string; title?: string; hasResponse?: boolean }) => Promise<void>;
  isUpdating: boolean;
  deleteConversation: (id: string) => Promise<void>;
  isDeleting: boolean;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  isSending: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  setCurrentConversation: (conversation: Conversation) => void;
  clearAllConversations: () => Promise<void>;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const {
    conversations = [],
    isLoading: isLoadingConversations,
    error: conversationsError,
    createConversation,
    isCreating,
    updateConversation,
    isUpdating,
    deleteConversation,
    isDeleting,
  } = useConversations();

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(conversationsError);

  useEffect(() => {
    let mounted = true;

    const initializeConversation = async () => {
      if (!session) {
        logger.debug('Waiting for session to be available');
        return;
      }

      try {
        if (!currentConversation && !isCreating) {
          if (conversations.length === 0) {
            logger.debug('No conversation found, creating new one');
            await createConversation('New Chat');
          } else {
            logger.debug('Setting current conversation to latest:', conversations[0]);
            setCurrentConversation(conversations[0]);
          }
        }
      } catch (err) {
        logger.error('Failed to initialize conversation:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize conversation'));
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeConversation();

    return () => {
      mounted = false;
    };
  }, [session, conversations, currentConversation, createConversation, isCreating]);

  const {
    messages = [],
    sendMessage: sendMessageToBackend,
    deleteMessage,
    isSending,
    isStreaming,
    streamingMessageId,
  } = useMessages(currentConversation?.id ?? '');

  const isLoading = isLoadingConversations || isInitializing;

  const handleSendMessage = async (content: string) => {
    try {
      // If no current conversation, create one with a title from the first message
      if (!currentConversation) {
        const title = content.split(' ').slice(0, 4).join(' ') + '...';
        const newConversation = await createConversation(title);
        setCurrentConversation(newConversation);
        await sendMessageToBackend(content);
        return;
      }

      // Send the message
      await sendMessageToBackend(content);

      // Update conversation title if it's still "New Chat" and this is the first message
      if (currentConversation.title === 'New Chat' && messages.length === 0) {
        const title = content.split(' ').slice(0, 4).join(' ') + '...';
        await updateConversation({ id: currentConversation.id, title });
      }
    } catch (err) {
      logger.error('Failed to send message:', err);
      throw err;
    }
  };

  const value = {
    currentConversation,
    conversations,
    isLoading,
    error,
    createConversation,
    isCreating,
    updateConversation,
    isUpdating,
    deleteConversation,
    isDeleting,
    messages,
    sendMessage: handleSendMessage,
    deleteMessage,
    isSending,
    isStreaming,
    streamingMessageId,
    setCurrentConversation,
    clearAllConversations: async () => {
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

        // Reset current conversation
        setCurrentConversation(null);
      } catch (err) {
        logger.error('Failed to clear conversations:', err);
        throw err;
      }
    },
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}