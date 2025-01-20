'use client';

import * as React from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function Chat() {
  const {
    messages,
    currentConversation,
    isSending,
    isStreaming,
    sendMessage,
  } = useChat();

  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const message = input.trim();
    setInput('');

    try {
      await sendMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error toast here
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select or create a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex w-full',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'rounded-lg px-4 py-2 max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 rounded-lg bg-muted px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI is typing...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !input.trim()}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 