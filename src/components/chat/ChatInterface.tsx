/**
 * ChatInterface component handles the main chat area display and interaction.
 * It manages message display, streaming states, and input handling.
 */

import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

export function ChatInterface() {
  const { messages, sendMessage, isSending, isStreaming } = useChat();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isStreaming={isStreaming && message.id === messages[messages.length - 1]?.id}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-background p-4">
        <ChatInput onSend={sendMessage} disabled={isSending} />
      </div>
    </div>
  );
} 