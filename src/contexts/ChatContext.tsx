'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  conversation_id: string;
  user_id: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  has_response: boolean;
}

interface ChatContextType {
  messages: Message[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isSending: boolean;
  isStreaming: boolean;
  createConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation) => void;
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = React.useState<Conversation | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);

  // Load conversations when user is authenticated
  React.useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Subscribe to messages for current conversation
  React.useEffect(() => {
    if (!currentConversation) return;

    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentConversation]);

  // Load messages when conversation changes
  React.useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  async function loadConversations() {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConversations(data);
      if (data.length > 0 && !currentConversation) {
        setCurrentConversation(data[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  async function loadMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function createConversation() {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            title: 'New Chat',
            user_id: user.id,
            has_response: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setConversations((prev) => [data, ...prev]);
      setCurrentConversation(data);
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  }

  async function deleteConversation(id: string) {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations((prev) => prev.filter((conv) => conv.id !== id));
      if (currentConversation?.id === id) {
        const nextConversation = conversations.find((conv) => conv.id !== id);
        setCurrentConversation(nextConversation || null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  async function sendMessage(content: string) {
    try {
      if (!user) throw new Error('User not authenticated');
      if (!currentConversation) throw new Error('No conversation selected');

      setIsSending(true);
      setIsStreaming(true);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          message: content,
          conversationId: currentConversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5);
            if (data === '[DONE]') {
              setIsStreaming(false);
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                // The real-time subscription will handle updating the messages
                continue;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  }

  const value = {
    messages,
    conversations,
    currentConversation,
    isSending,
    isStreaming,
    createConversation,
    deleteConversation,
    sendMessage,
    setCurrentConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = React.useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 