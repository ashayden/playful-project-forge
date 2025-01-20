'use client';

import * as React from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '@/types/chat';

export function ChatInterface() {
  const {
    messages,
    currentConversation,
    isSending,
    isStreaming,
    sendMessage,
  } = useChat();

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!currentConversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Select or create a conversation to start chatting
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message: Message, index: number) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
          {isStreaming && (
            <TypingIndicator isTyping={true} className="ml-4" />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t p-4">
        <ChatInput
          onSend={sendMessage}
          disabled={isSending}
          className="mx-auto max-w-4xl"
        />
      </div>
    </div>
  );
} 