'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps extends Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ className, onSend, disabled, ...props }: ChatInputProps) {
  const [content, setContent] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;

    try {
      await onSend(content);
      setContent('');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)} {...props}>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        className="min-h-[60px] w-full resize-none rounded-lg pr-12"
        rows={1}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || disabled}
        className="absolute bottom-2 right-2"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
} 