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
        "flex items-center space-x-1",
        isStreaming && "scale-100",
        !isStreaming && "scale-0",
        "transition-transform duration-200",
        className
      )}
      {...props}
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-blue-500",
            "animate-bounce",
            // Stagger the animation
            i === 0 && "animation-delay-0",
            i === 1 && "animation-delay-[200ms]",
            i === 2 && "animation-delay-[400ms]"
          )}
        />
      ))}
    </div>
  );
} 