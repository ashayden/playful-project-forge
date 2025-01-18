import { Message } from '@/types/messages';
import { ChatState, ChatAction, Conversation } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/loggingService';

/**
 * Chat service that handles both state management and database operations.
 * Provides a centralized location for all chat-related functionality.
 */

// Types
type CreateMessageParams = {
  content: string;
  role: 'user' | 'assistant' | 'system';
  conversation_id: string;
  user_id: string;
};

type UpdateMessageParams = {
  id: string;
  content: string;
};

type CreateConversationParams = {
  title: string;
  user_id: string;
};

// State Management
/**
 * Reducer function for managing chat state
 * @param state Current chat state
 * @param action Action to perform on the state
 * @returns Updated chat state
 */
export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
      
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload };
      
    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        currentConversation: action.payload,
      };

    case 'DELETE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(conv => conv.id !== action.payload),
        currentConversation: state.currentConversation?.id === action.payload 
          ? null 
          : state.currentConversation,
      };
      
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
      
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
      
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.id
            ? { ...message, content: action.payload.content }
            : message
        ),
      };
      
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    default:
      return state;
  }
}

// Database Operations
/**
 * Creates a new message in the database
 * @param params Message parameters including content, role, conversation ID, and user ID
 * @returns Created message object
 * @throws Error if message creation fails
 */
export async function createMessage(params: CreateMessageParams): Promise<Message> {
  logger.debug('Creating message:', params);

  const { data, error } = await supabase
    .from('messages')
    .insert([params])
    .select()
    .single();

  if (error) {
    logger.error('Error creating message:', error);
    throw error;
  }

  return data as Message;
}

/**
 * Updates an existing message in the database
 * @param params Message update parameters including ID and new content
 * @throws Error if message update fails
 */
export async function updateMessage(params: UpdateMessageParams): Promise<void> {
  logger.debug('Updating message:', params);

  const { error } = await supabase
    .from('messages')
    .update({ content: params.content })
    .eq('id', params.id);

  if (error) {
    logger.error('Error updating message:', error);
    throw error;
  }
}

/**
 * Creates a new conversation in the database
 * @param params Conversation parameters including title and user ID
 * @returns Created conversation object
 * @throws Error if conversation creation fails
 */
export async function createConversation(params: CreateConversationParams): Promise<Conversation> {
  logger.debug('Creating conversation:', params);

  const { data, error } = await supabase
    .from('conversations')
    .insert([params])
    .select()
    .single();

  if (error) {
    logger.error('Error creating conversation:', error);
    throw error;
  }

  return data as Conversation;
}

/**
 * Deletes a conversation and its messages from the database
 * @param id Conversation ID to delete
 * @throws Error if conversation deletion fails
 */
export async function deleteConversation(id: string): Promise<void> {
  logger.debug('Deleting conversation:', id);

  // Delete all messages in the conversation first
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', id);

  if (messagesError) {
    logger.error('Error deleting conversation messages:', messagesError);
    throw messagesError;
  }

  // Then delete the conversation
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting conversation:', error);
    throw error;
  }
}

/**
 * Fetches messages for a specific conversation
 * @param conversationId ID of the conversation to fetch messages for
 * @returns Array of messages
 * @throws Error if message fetching fails
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  logger.debug('Fetching messages for conversation:', conversationId);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error fetching messages:', error);
    throw error;
  }

  return data as Message[];
}

/**
 * Fetches all conversations for a user
 * @param userId ID of the user to fetch conversations for
 * @returns Array of conversations
 * @throws Error if conversation fetching fails
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  logger.debug('Fetching conversations for user:', userId);

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    logger.error('Error fetching conversations:', error);
    throw error;
  }

  return data as Conversation[];
}