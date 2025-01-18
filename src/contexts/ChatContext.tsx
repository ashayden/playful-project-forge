import { createContext, useContext, ReactNode, useState } from 'react';
import { Message, Conversation } from '@/types/chat';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
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
  const {
    conversations = [],
    isLoading,
    error,
    createConversation,
    isCreating,
  } = useConversations();

  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  const {
    messages = [],
    sendMessage,
    isSending,
  } = useMessages(currentConversation?.id ?? '');

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