import { supabase } from "@/integrations/supabase/client";
import { Message, MessageData, MessageRole } from "@/types/messages";
import { logger } from "@/services/loggingService";
import { PostgrestError } from "@supabase/supabase-js";
import { AIService } from "@/services/ai/AIService";
import { defaultSystemPrompt } from "@/config/ai.config";

export class MessageService {
  private static aiService = new AIService(defaultSystemPrompt);

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

  static async sendMessageToAI(
    messages: Message[],
    onUpdate: (content: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      logger.debug('Sending messages to AI:', { messageCount: messages.length });
      
      // Convert messages to the format expected by AIService
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Process the messages using AIService with streaming
      await this.aiService.processMessageStream(formattedMessages, {
        onToken: (token: string) => {
          onUpdate(token);
        },
        onComplete: () => {
          onComplete?.();
        },
        onError: (error: Error) => {
          logger.error('Error in AI stream:', error);
          throw error;
        }
      });

      logger.debug('AI streaming completed successfully');
    } catch (error) {
      logger.error('Error in sendMessageToAI:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unknown error occurred while processing the AI response');
    }
  }
}