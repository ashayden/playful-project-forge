'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AIService } from '@/services/ai/AIService';
import { logger } from '@/services/loggingService';
import { Message, Conversation } from '@/types/chat';

interface ChatContextType {
  messages: Message[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isStreaming: boolean;
  isSending: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  createConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) return;
    
    try {
      const userMessage: Message = {
        role: 'user',
        content,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsStreaming(true);
      setIsSending(true);

      const stream = await AIService.streamCompletion([...messages, userMessage]);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.content || '';
                assistantMessage += content;
                
                // Update the message in real-time
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  if (lastMessage?.role === 'assistant') {
                    return [
                      ...prev.slice(0, -1),
                      { ...lastMessage, content: assistantMessage },
                    ];
                  } else {
                    return [
                      ...prev,
                      {
                        role: 'assistant',
                        content: assistantMessage,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                      },
                    ];
                  }
                });
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      setIsStreaming(false);
      setIsSending(false);
    } catch (error) {
      logger.error('Error in sendMessage:', error);
      setIsStreaming(false);
      setIsSending(false);
    }
  }, [messages, currentConversation]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const createConversation = useCallback(async () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setMessages([]);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (currentConversation?.id === id) {
      const nextConversation = conversations.find(conv => conv.id !== id);
      setCurrentConversation(nextConversation || null);
      setMessages(nextConversation?.messages || []);
    }
  }, [conversations, currentConversation]);

  return (
    <ChatContext.Provider value={{
      messages,
      conversations,
      currentConversation,
      isStreaming,
      isSending,
      sendMessage,
      clearMessages,
      createConversation,
      deleteConversation,
      setCurrentConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 