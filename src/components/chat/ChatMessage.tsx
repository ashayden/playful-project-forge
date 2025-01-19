/**
 * ChatMessage component displays a single message in the chat interface.
 * It handles both user and AI messages, including streaming state.
 */

import { Message } from '@/types/chat';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg p-4 ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      }`}>
        <div className="prose dark:prose-invert">
          {message.content}
          {isStreaming && <TypingIndicator isStreaming={isStreaming} />}
        </div>
      </div>
    </div>
  );
}