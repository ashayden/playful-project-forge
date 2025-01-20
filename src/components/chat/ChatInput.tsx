'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({ onSend, disabled, className }: ChatInputProps) {
  const [input, setInput] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    onSend(input);
    setInput('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className="min-h-[52px] resize-none"
          rows={1}
        />
        <Button type="submit" size="icon" disabled={disabled || !input.trim()}>
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
} 