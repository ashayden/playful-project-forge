import { supabase } from "@/integrations/supabase/client";
import { Message, MessageData, AIResponse, MessageRole } from "@/types/messages";
import { logger } from "@/services/loggingService";
import { PostgrestError, FunctionsResponse } from "@supabase/supabase-js";

export class MessageService {
  static async createMessage(messageData: MessageData): Promise<Message> {
    logger.debug('Creating message:', messageData);
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      const errorMessage = error.message || 'Failed to create message';
      logger.error('Error creating message:', error);
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error('No data returned from message creation');
    }

    return {
      ...data,
      role: data.role as MessageRole,
      user_id: data.user_id
    };
  }

  static async updateMessage(messageId: string, content: string): Promise<Message> {
    logger.debug('Updating message:', { messageId, contentLength: content.length });
    const { data, error } = await supabase
      .from('messages')
      .update({ content })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      const errorMessage = error.message || 'Failed to update message';
      logger.error('Error updating message:', error);
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error('No data returned from message update');
    }

    return {
      ...data,
      role: data.role as MessageRole,
      user_id: data.user_id
    };
  }

  static async sendMessageToAI(messages: Message[], model: string): Promise<string> {
    try {
      logger.debug('Sending messages to AI:', { messageCount: messages.length, model });
      
      const response = await supabase.functions.invoke<{ data: AIResponse }>('chat', {
        body: { messages, model },
      });

      if (response.error) {
        const errorMessage = response.error.message || 'Failed to get AI response';
        logger.error('AI function error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!response.data?.data?.content) {
        const errorMessage = 'Invalid response format from AI';
        logger.error(errorMessage, response);
        throw new Error(errorMessage);
      }

      logger.debug('AI response received successfully');
      return response.data.data.content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      logger.error('Error in sendMessageToAI:', errorMessage);
      throw new Error(errorMessage);
    }
  }
}