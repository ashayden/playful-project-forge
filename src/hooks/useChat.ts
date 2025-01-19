import { useContext } from 'react';
import { ChatContext } from '@/contexts/ChatContext';
import type { ChatContextType } from '@/types/chat';

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
} 