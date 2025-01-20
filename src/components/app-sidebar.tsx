'use client';

import * as React from 'react';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar } from '@/components/ui/sidebar';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from '@/types/chat';

export function AppSidebar() {
  const {
    conversations,
    currentConversation,
    createConversation,
    deleteConversation,
    setCurrentConversation,
  } = useChat();

  return (
    <Sidebar className="border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button
            onClick={() => createConversation()}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-2">
            {conversations.map((conversation: Conversation) => (
              <div
                key={conversation.id}
                className="flex items-center gap-2"
              >
                <Button
                  onClick={() => setCurrentConversation(conversation)}
                  variant={currentConversation?.id === conversation.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="truncate">{conversation.title}</span>
                </Button>
                <Button
                  onClick={() => deleteConversation(conversation.id)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Sidebar>
  );
} 