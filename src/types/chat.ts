/**
 * Represents a chat message in the system
 */
export interface Message {
  id: string;
  created_at: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  conversation_id: string;
  user_id: string;
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
  created_at: string;
  title: string;
  user_id: string;
  model: string;
  has_response: boolean;
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