/**
 * Represents a chat message in the system
 */
export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  conversation_id: string;
  user_id: string | null;
  created_at?: string;
  reactions?: MessageReaction[];
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
 * Represents a conversation in the chat system
 */
export interface Conversation {
  id: string;
  title: string | null;
  model: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };