import { createContext, type ReactNode, useState, useCallback, useEffect } from 'react';
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

  // Fetch initial conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.id) {
          logger.error('No authenticated user found');
          return;
        }

        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          logger.error('Error fetching conversations:', error);
          return;
        }

        setConversations(data || []);
      } catch (error) {
        logger.error('Failed to fetch conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentConversation?.id) return;

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', currentConversation.id)
          .order('created_at', { ascending: true });
        
        if (error) {
          logger.error('Error fetching messages:', error);
          return;
        }

        setMessages(data || []);
      } catch (error) {
        logger.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [currentConversation?.id]);

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

      setConversations((prev: Conversation[]) => [data, ...prev]);
      setCurrentConversation(data);
      setMessages([]);

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
        setMessages([]);
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
    let tempUserMessage: Message | null = null;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create temporary user message for immediate display
      tempUserMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        conversation_id: currentConversation.id,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
      
      // Immediately update UI with user message
      setMessages((prev: Message[]) => [...prev, tempUserMessage!]);

      // Get auth token for API call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      // Call API
      const response = await fetch(`${window.location.origin}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ 
          message: content,
          conversationId: currentConversation.id 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${errorText}`);
      }

      const responseText = await response.text();

      // Fetch updated messages to ensure we have the correct IDs from the database
      const { data: updatedMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConversation.id)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      setMessages(updatedMessages || []);

    } catch (error) {
      logger.error('Failed to send message:', error);
      // Remove the temporary message on error
      if (tempUserMessage) {
        setMessages((prev: Message[]) => prev.filter(m => m.id !== tempUserMessage!.id));
      }
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