'use client';

import * as React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";
import { AIService } from '@/services/ai/AIService';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  id?: string;
  conversation_id?: string;
}

export default function ChatPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [conversations, setConversations] = React.useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = React.useState<string | null>(null);

  // Load conversations
  React.useEffect(() => {
    if (!user) return;
    
    const loadConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setConversations(data || []);
    };

    loadConversations();
  }, [user]);

  // Load messages for current conversation
  React.useEffect(() => {
    if (!currentConversationId) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    };

    loadMessages();
  }, [currentConversationId]);

  const createNewConversation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return;
    }

    setCurrentConversationId(data.id);
    setMessages([]);
    setConversations(prev => [data, ...prev]);
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    try {
      // Create new conversation if none exists
      if (!currentConversationId) {
        await createNewConversation();
      }

      // Add user message to the UI immediately
      const userMessage: Message = { 
        content, 
        role: 'user',
        conversation_id: currentConversationId!
      };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      const stream = await AIService.streamCompletion({
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        conversationId: currentConversationId!
      });

      const reader = stream.getReader();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.role === 'assistant') {
                    lastMessage.content = assistantMessage;
                    return [...newMessages];
                  } else {
                    return [...newMessages, { content: assistantMessage, role: 'assistant', conversation_id: currentConversationId }];
                  }
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
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
          <Button variant="ghost" size="icon" onClick={createNewConversation}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant={currentConversationId === conversation.id ? "secondary" : "ghost"}
              className="w-full justify-start mb-1"
              onClick={() => setCurrentConversationId(conversation.id)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {conversation.title || 'New Chat'}
            </Button>
          ))}
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