import { Message } from '@/types/messages';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { LoadingDots } from '@/components/LoadingDots';

export interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  isStreaming?: boolean;
  onDelete?: (messageId: string) => void;
}

export function ChatMessage({ message, isTyping, isStreaming, onDelete }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn(
      'group flex items-start gap-4 rounded-lg px-4 py-3',
      isUser && 'bg-zinc-900/50',
      isAssistant && 'bg-zinc-800/50'
    )}>
      <div className={cn(
        'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border text-sm font-semibold',
        isUser && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        isAssistant && 'bg-green-500/10 text-green-500 border-green-500/20'
      )}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">
            {message.content}
            {(isTyping || isStreaming) && <LoadingDots />}
          </p>
        </div>
      </div>
      {onDelete && message.id && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 opacity-0 group-hover:opacity-100',
            (isTyping || isStreaming) && 'pointer-events-none'
          )}
          onClick={() => onDelete(message.id!)}
          disabled={isTyping || isStreaming}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete message</span>
        </Button>
      )}
    </div>
  );
}