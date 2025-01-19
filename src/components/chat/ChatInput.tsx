import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from 'lucide-react';
import { useChat } from '@/hooks/useChat';

export function ChatInput() {
  const { sendMessage, isSending } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (textareaRef.current && !isSending) {
      textareaRef.current.focus();
    }
  }, [isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isSending) return;

    try {
      await sendMessage(value.trim());
      setValue(''); // Clear input after successful submission
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
        className="min-h-[44px] resize-none"
        disabled={isSending}
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={isSending || !value.trim()}
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </form>
  );
}