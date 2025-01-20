'use client';

import * as React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";

interface Message {
  content: string;
  role: 'user' | 'assistant';
}

export default function ChatPage() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = React.useState<Message[]>([]);

  const handleSendMessage = async (content: string) => {
    // Add user message to the UI immediately
    const userMessage: Message = { content, role: 'user' };
    setMessages((prev: Message[]) => [...prev, userMessage]);

    try {
      // TODO: Implement API call to process message
      // For now, just echo the message back
      const assistantMessage: Message = { content: `Echo: ${content}`, role: 'assistant' };
      setMessages((prev: Message[]) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <h2 className="font-semibold">Chats</h2>
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {/* Conversation list will go here */}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-semibold">New Chat</h3>
          </div>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {messages.map((message: Message, index: number) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          <ChatInput onSend={handleSendMessage} className="max-w-none" />
        </div>
      </div>
    </div>
  );
} 