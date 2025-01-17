import { createContext, useContext, useReducer, ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { chatReducer } from "@/reducers/chatReducer";
import { ChatState } from "@/types/chat";
import { Message, MessageRole } from "@/types/messages";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useConversations } from "@/hooks/useConversations";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/services/loggingService";

interface ChatContextType {
  state: ChatState;
  createConversation: (model: string) => Promise<any>;
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  loadConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
};

const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendMessage: sendChatMessage } = useChatMessages();
  const { 
    createConversation: createNewConversation, 
    loadConversations: loadAllConversations,
    loadConversation: loadSingleConversation,
  } = useConversations();

  const createConversation = async (model: string) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const conversation = await createNewConversation(model, user);
      dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
      return conversation;
    } catch (error) {
      const errorMessage = handleError(error);
      logger.error('Error in createConversation:', errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const loadConversations = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const conversations = await loadAllConversations();
      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations });
    } catch (error) {
      const errorMessage = handleError(error);
      logger.error('Error in loadConversations:', errorMessage);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadConversation = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { conversation, messages } = await loadSingleConversation(id);
      
      const typedMessages: Message[] = messages.map(msg => ({
        ...msg,
        role: msg.role as MessageRole,
        user_id: msg.user_id ?? null
      }));
      
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation });
      dispatch({ type: 'SET_MESSAGES', payload: typedMessages });
    } catch (error) {
      const errorMessage = handleError(error);
      logger.error('Error in loadConversation:', errorMessage);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const sendMessage = async (content: string) => {
    if (!state.currentConversation || !user) {
      toast({
        title: "Error",
        description: "No active conversation or user not authenticated",
        variant: "destructive",
      });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const userMessage: Message = {
        role: 'user',
        content,
        conversation_id: state.currentConversation.id,
        user_id: user.id,
        created_at: new Date().toISOString(),
      };

      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        conversation_id: state.currentConversation.id,
        user_id: null,
        created_at: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

      const [finalUserMessage, finalAssistantMessage] = await sendChatMessage(
        content,
        state.currentConversation.id,
        user.id,
        state.currentConversation.model,
        state.messages,
        (id: string, content: string) => {
          if (id) {
            dispatch({
              type: 'UPDATE_MESSAGE',
              payload: { id, content }
            });
          }
        }
      );

      if (finalUserMessage.id) {
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { id: finalUserMessage.id, content: finalUserMessage.content } 
        });
      }
      
      if (finalAssistantMessage.id) {
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { id: finalAssistantMessage.id, content: finalAssistantMessage.content } 
        });
      }
    } catch (error) {
      const errorMessage = handleError(error);
      logger.error('Error in sendMessage:', errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <ChatContext.Provider value={{
      state,
      createConversation,
      sendMessage,
      loadConversation,
      loadConversations,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}