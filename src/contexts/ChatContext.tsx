import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Message, Conversation } from '@/types/chat';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/services/loggingService';

type ChatContextType = {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  createConversation: (title: string) => void;
  isCreating: boolean;
  messages: Message[];
  sendMessage: (content: string) => void;
  isSending: boolean;
  setCurrentConversation: (conversation: Conversation) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const {
    conversations = [],
    isLoading: isLoadingConversations,
    error: conversationsError,
    createConversation,
    isCreating,
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
    sendMessage,
    isSending,
  } = useMessages(currentConversation?.id ?? '');

  const isLoading = isLoadingConversations || isInitializing;

  const value = {
    currentConversation,
    conversations,
    isLoading,
    error,
    createConversation,
    isCreating,
    messages,
    sendMessage: (content: string) => sendMessage({ content }),
    isSending,
    setCurrentConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}