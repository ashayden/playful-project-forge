import { Message } from '@/types/messages';
import { LoadingDots } from '@/components/LoadingDots';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  className?: string;
}

export function ChatMessage({ message, isStreaming, className }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3 p-4", isUser ? "justify-end" : "justify-start", className)}>
      <Avatar className={cn("h-8 w-8", isUser && "order-last")}>
        <AvatarFallback>{isUser ? 'U' : 'AI'}</AvatarFallback>
      </Avatar>
      <Card className={cn(
        "max-w-[80%]",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        <CardContent className="p-3 text-sm">
          {message.content}
          {isStreaming && <LoadingDots />}
        </CardContent>
      </Card>
    </div>
  );
}