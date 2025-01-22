'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AIService } from '@/services/ai/AIService';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface ChatContextType {
  messages: ChatCompletionMessageParam[];
  isStreaming: boolean;
  isSending: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsSending(true);
      
      // Add user message
      const userMessage: ChatCompletionMessageParam = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Generate conversation ID if needed
      const conversationId = crypto.randomUUID();

      // Start streaming
      setIsStreaming(true);
      const stream = await AIService.streamCompletion({
        messages: [...messages, userMessage],
        conversationId,
      });

      // Create a decoder for the stream
      const decoder = new TextDecoder();
      const reader = stream.getReader();

      // Initialize assistant's message
      let assistantMessage: ChatCompletionMessageParam = {
        role: 'assistant',
        content: '',
      };
      setMessages(prev => [...prev, assistantMessage]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          // Process each line
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  // Update assistant's message
                  assistantMessage.content += parsed.content;
                  setMessages(prev => [
                    ...prev.slice(0, -1),
                    { ...assistantMessage },
                  ]);
                } else if (parsed.error) {
                  console.error('Stream error:', parsed.error);
                  throw new Error(parsed.error);
                }
              } catch (error) {
                console.error('Error parsing stream data:', error);
                console.log('Raw data:', data);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error reading stream:', error);
        throw error;
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      // Add error message to the chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while processing your message. Please try again.',
        },
      ]);
    } finally {
      setIsStreaming(false);
      setIsSending(false);
    }
  }, [messages]);

  return (
    <ChatContext.Provider value={{ messages, isStreaming, isSending, sendMessage }}>
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