import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/messages';
import { logger } from '@/services/loggingService';

type MessageHandler = (message: Message) => void;

export function useRealtimeMessages(
  conversationId: string | undefined,
  onNewMessage: MessageHandler,
  onUpdateMessage: MessageHandler
) {
  useEffect(() => {
    if (!conversationId) {
      logger.debug('No conversation ID provided for real-time subscription');
      return;
    }

    logger.debug('Setting up real-time message subscription', { conversationId });

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          logger.debug('Received new message', payload);
          onNewMessage(payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          logger.debug('Received message update', payload);
          onUpdateMessage(payload.new as Message);
        }
      )
      .subscribe((status) => {
        logger.debug('Subscription status:', status);
      });

    return () => {
      logger.debug('Cleaning up message subscription', { conversationId });
      subscription.unsubscribe();
    };
  }, [conversationId, onNewMessage, onUpdateMessage]);
} 