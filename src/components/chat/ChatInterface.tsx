/**
 * ChatInterface component handles the main chat area display and interaction.
 * It manages message display, streaming states, and input handling.
 */

import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';

export function ChatInterface() {
  const { messages, isSending, isStreaming } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <h3 className="text-lg font-semibold mb-2">Welcome to Chat Assistant</h3>
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
              />
            ))
          )}
          {isSending && (
            <div className="py-2">
              <TypingIndicator isStreaming={isStreaming} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput />
    </div>
  );
} 