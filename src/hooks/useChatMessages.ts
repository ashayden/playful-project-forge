import { useState } from "react";
import { Message, MessageRole } from "@/types/messages";
import { useToast } from "@/hooks/use-toast";
import { MessageService } from "@/services/messageService";
import { logger } from "@/services/loggingService";

export function useChatMessages() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (
    content: string,
    conversationId: string,
    userId: string,
    previousMessages: Message[],
    onMessageUpdate: (id: string, content: string) => void
  ): Promise<void> => {
    try {
      setIsLoading(true);
      logger.debug('Starting message send process:', { conversationId });
      
      // Create user message - real-time subscription will handle state update
      await MessageService.createMessage({
        role: 'user' as MessageRole,
        content,
        conversation_id: conversationId,
        user_id: userId,
      });
      logger.debug('User message created');

      // Create empty assistant message - real-time subscription will handle state update
      const assistantMessage = await MessageService.createMessage({
        role: 'assistant' as MessageRole,
        content: '',
        conversation_id: conversationId,
        user_id: null,
      });
      logger.debug('Assistant message placeholder created');

      // Get AI response
      const aiResponse = await MessageService.sendMessageToAI(previousMessages);
      logger.debug('AI response received');

      // Update assistant message - real-time subscription will handle state update
      await MessageService.updateMessage(assistantMessage.id!, aiResponse);
      onMessageUpdate(assistantMessage.id!, aiResponse);
      
    } catch (error) {
      logger.error('Error in sendMessage:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred while sending the message',
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading
  };
}