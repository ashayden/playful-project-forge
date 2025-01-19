import { cn } from '@/lib/utils';
import { ComponentPropsWithoutRef } from 'react';

interface TypingIndicatorProps extends ComponentPropsWithoutRef<'div'> {
  isStreaming?: boolean;
}

export function TypingIndicator({ 
  isStreaming = false,
  className,
  ...props 
}: TypingIndicatorProps) {
  return (
    <div 
      role="status"
      aria-label="AI is typing"
      className={cn(
        "flex items-center gap-2",
        isStreaming ? "opacity-100" : "opacity-0",
        "transition-opacity duration-300 ease-in-out",
        className
      )}
      {...props}
    >
      <span className="text-sm text-muted-foreground">AI is thinking</span>
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-2 rounded-full bg-primary/50",
              "animate-bounce",
              i === 0 && "animation-delay-0",
              i === 1 && "animation-delay-150",
              i === 2 && "animation-delay-300"
            )}
            style={{
              animationDuration: '1s',
              animationIterationCount: 'infinite'
            }}
          />
        ))}
      </div>
    </div>
  );
} 