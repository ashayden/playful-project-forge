import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Message, Conversation } from '@/types/chat';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import { logger } from '@/services/loggingService';

type ChatState = {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
};

type ChatContextType = {
  state: ChatState;
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

type ChatAction =
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation }
  | { type: 'SET_MESSAGES'; payload: Message[] };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CURRENT_CONVERSATION':
      return {
        ...state,
        currentConversation: action.payload,
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    default:
      return state;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, {
    conversations: [],
    currentConversation: null,
    messages: [],
  });

  const {
    conversations,
    isLoading,
    error,
    createConversation,
    isCreating,
  } = useConversations();

  const {
    messages,
    sendMessage,
    isSending,
  } = useMessages(state.currentConversation?.id ?? '');

  const setCurrentConversation = (conversation: Conversation) => {
    logger.debug('Setting current conversation:', conversation);
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
  };

  const value = {
    state,
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