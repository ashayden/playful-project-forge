import { createContext, type ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import type { Message, Conversation, ChatContextType } from '@/types/chat';
import { logger } from '@/services/loggingService';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
}

// Define the message type for real-time updates
type MessagePayload = {
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  user_id?: string;
  created_at: string;
};

export function ChatProvider({ children }: ChatProviderProps) {
  const queryClient = useQueryClient();
  const messageStreamRef = useRef<string>('');

  // State declarations with explicit types
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Set up real-time subscriptions
  useEffect(() => {
    const conversationsSubscription = supabase
      .channel('conversations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Refresh conversations list
          const { data: updatedConversations } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (updatedConversations) {
            setConversations(updatedConversations);
          }
        }
      )
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async (payload: RealtimePostgresChangesPayload<MessagePayload>) => {
          if (!currentConversation?.id) return;
          
          const newMessage = payload.new as MessagePayload;
          if (!newMessage || newMessage.conversation_id !== currentConversation.id) return;

          // Refresh messages for current conversation
          const { data: updatedMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentConversation.id)
            .order('created_at', { ascending: true });

          if (updatedMessages) {
            setMessages(updatedMessages);
          }
        }
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [currentConversation?.id]);

  // Create a new chat when user logs in and no conversations exist
  useEffect(() => {
    const checkAndCreateChat = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existingConversations, error } = await supabase
          .from('conversations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Error fetching conversations:', error);
          return;
        }

        if (!existingConversations?.length) {
          await createConversation('New Chat');
        } else {
          setConversations(existingConversations);
          setCurrentConversation(existingConversations[0]);
        }
      } catch (error) {
        logger.error('Error checking/creating initial chat:', error);
      }
    };

    checkAndCreateChat();
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

  // Delete empty conversations
  useEffect(() => {
    const deleteEmptyConversations = async () => {
      try {
        const { data: emptyConversations, error: fetchError } = await supabase
          .from('conversations')
          .select('id')
          .not('id', 'in', (
            supabase
              .from('messages')
              .select('conversation_id')
          ));

        if (fetchError) {
          logger.error('Error fetching empty conversations:', fetchError);
          return;
        }

        if (emptyConversations?.length) {
          const { error: deleteError } = await supabase
            .from('conversations')
            .delete()
            .in('id', emptyConversations.map(c => c.id));

          if (deleteError) {
            logger.error('Error deleting empty conversations:', deleteError);
          }
        }
      } catch (error) {
        logger.error('Error cleaning up empty conversations:', error);
      }
    };

    // Run cleanup when component unmounts or conversation changes
    return () => {
      if (currentConversation?.id) {
        deleteEmptyConversations();
      }
    };
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
    setIsStreaming(true);
    messageStreamRef.current = '';
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Save user message to database first
      const { error: saveError } = await supabase
        .from('messages')
        .insert([{
          role: 'user',
          content,
          conversation_id: currentConversation.id,
          user_id: user.id
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      // Create temporary assistant message for streaming
      const tempAssistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        conversation_id: currentConversation.id,
        user_id: undefined,
        created_at: new Date().toISOString()
      };

      // Add temporary assistant message to UI
      setMessages((prev) => [...prev, tempAssistantMessage]);

      // Get auth token for API call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      // Call API with streaming
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

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        messageStreamRef.current += chunk;

        // Update the temporary message with accumulated content
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage && lastMessage.id === tempAssistantMessage.id) {
            lastMessage.content = messageStreamRef.current;
          }
          return updated;
        });
      }

      // Save the complete assistant message to database
      await supabase
        .from('messages')
        .insert([{
          role: 'assistant',
          content: messageStreamRef.current,
          conversation_id: currentConversation.id,
          user_id: user.id
        }]);

    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    } finally {
      setIsSending(false);
      setIsStreaming(false);
      messageStreamRef.current = '';
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