import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({ onSend, disabled, className }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "flex gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Send a message..."
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 min-h-[2.5rem] resize-none",
          "focus-visible:ring-1 focus-visible:ring-ring",
          "placeholder:text-muted-foreground"
        )}
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !input.trim()}
        className={cn(
          "h-10 w-10",
          "transition-opacity",
          (!input.trim() || disabled) && "opacity-50"
        )}
      >
        <SendHorizontal className="h-5 w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}