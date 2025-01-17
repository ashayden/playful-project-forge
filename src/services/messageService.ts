import { supabase } from "@/integrations/supabase/client";
import { Message, MessageData, AIResponse, MessageRole, FunctionsResponse } from "@/types/messages";
import { logger } from "@/services/loggingService";
import { PostgrestError } from "@supabase/supabase-js";

export class MessageService {
  static async createMessage(messageData: MessageData): Promise<Message> {
    logger.debug('Creating message:', messageData);
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating message:', error as PostgrestError);
      throw new Error(error.message);
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
      logger.error('Error updating message:', error as PostgrestError);
      throw new Error(error.message);
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
        logger.error('AI function error:', response.error);
        throw new Error(response.error.message);
      }

      if (!response.data?.data?.content) {
        const errorMessage = 'Invalid response format from AI';
        logger.error(errorMessage, response);
        throw new Error(errorMessage);
      }

      logger.debug('AI response received successfully');
      return response.data.data.content;
    } catch (error) {
      logger.error('Error in sendMessageToAI:', error instanceof Error ? error : 'Unknown error');
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
  }
}