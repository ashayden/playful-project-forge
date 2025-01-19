import { Message } from '@/types/messages';
import { LoadingDots } from '@/components/LoadingDots';

export interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`p-4 ${isUser ? 'bg-blue-900' : 'bg-gray-800'} rounded`}>
      <div className="flex gap-2">
        <span className="font-bold">{isUser ? 'You' : 'AI'}:</span>
        <div className="flex-1">
          {message.content}
          {isStreaming && <LoadingDots />}
        </div>
      </div>
    </div>
  );
}