/**
 * Types for chat functionality
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  conversation_id?: string;
  user_id?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  has_response?: boolean;
}

export interface ChatContextType {
  messages: Message[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isCreating: boolean;
  isDeleting: boolean;
  isSending: boolean;
  isStreaming: boolean;
  createConversation: (title: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

/**
 * Represents a reaction to a message
 */
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

/**
 * Represents the global chat state
 */
export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Union type for all possible chat actions
 */
export type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };