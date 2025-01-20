'use client';

import * as React from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const { user } = useAuth();
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full items-start gap-4 px-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border text-sm font-semibold',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? user?.email?.[0].toUpperCase() : 'AI'}
      </div>
      <div
        className={cn(
          'flex-1 space-y-2 overflow-hidden',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'inline-block rounded-lg px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    </div>
  );
} 