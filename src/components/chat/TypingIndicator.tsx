'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TypingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  isTyping?: boolean;
}

export function TypingIndicator({
  isTyping,
  className,
  ...props
}: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-muted px-4 py-2',
        className
      )}
      {...props}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>AI is typing...</span>
    </div>
  );
} 