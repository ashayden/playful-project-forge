'use client';

import * as React from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar } from '@/components/ui/sidebar';
import { Plus, MessageSquare } from 'lucide-react';

export function AppSidebar() {
  const { messages, sendMessage } = useChat();

  return (
    <Sidebar className="border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button
            onClick={() => sendMessage('Hello! How can you help me today?')}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-2">
            {messages.map((message, index) => (
              <div
                key={index}
                className="flex items-center gap-2"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="truncate">{message.role}: {typeof message.content === 'string' ? message.content.slice(0, 30) + '...' : 'Content'}</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Sidebar>
  );
} 