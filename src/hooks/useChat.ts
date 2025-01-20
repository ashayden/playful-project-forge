import { useContext } from 'react';
import { ChatContext } from '@/contexts/ChatContext';
import { Message, Conversation } from '@/types/chat';

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 