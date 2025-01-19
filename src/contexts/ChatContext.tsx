import { createContext, type ReactNode, useState, useCallback } from 'react';
import type { Message, Conversation, ChatContextType } from '@/types/chat';
import { logger } from '@/services/loggingService';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const queryClient = useQueryClient();

  // State declarations with explicit types
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const createConversation = useCallback(async (title: string) => {
    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert([{ title, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        logger.error('Error creating conversation:', error);
        throw error;
      }

      setConversations((prev: Conversation[]) => [...prev, data]);
      setCurrentConversation(data);

      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      logger.error('Failed to create conversation:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [queryClient]);

  const deleteConversation = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);
      
      if (error) {
        logger.error('Error deleting conversation:', error);
        throw error;
      }

      setConversations((prev: Conversation[]) => prev.filter((conv: Conversation) => conv.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }

      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      logger.error('Failed to delete conversation:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [currentConversation?.id, queryClient]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) return;
    
    setIsSending(true);
    setIsStreaming(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        conversation_id: currentConversation.id
      };
      
      setMessages((prev: Message[]) => [...prev, userMessage]);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I am thinking...',
        conversation_id: currentConversation.id
      };
      
      setMessages((prev: Message[]) => [...prev, assistantMessage]);
      
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  }, [currentConversation]);

  const value: ChatContextType = {
    messages,
    conversations,
    currentConversation,
    isCreating,
    isDeleting,
    isSending,
    isStreaming,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    sendMessage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}