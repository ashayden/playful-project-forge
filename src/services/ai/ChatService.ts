import { AIService } from './AIService';
import { aiConfig } from '@/config/ai.config';
import { Message } from '@/types/messages';
import { logger } from '@/services/loggingService';
import { ChatOpenAI } from 'langchain/chat_models/openai';

/**
 * Service for handling chat interactions
 * This service acts as a bridge between the application's chat interface and the AI service,
 * handling message formatting, logging, and error management.
 */
export class ChatService {
  private aiService: AIService;

  /**
   * Creates an instance of ChatService
   * Initializes the underlying AI service with the default system prompt
   */
  constructor() {
    this.aiService = new AIService(aiConfig.defaultPrompt);
  }

  /**
   * Processes a chat message and generates a streaming response
   * Takes the conversation history and current message, formats them appropriately,
   * sends them to the AI service, and handles any errors that occur
   * 
   * @param messages - Array of messages in the conversation
   * @param callbacks - Callbacks for handling streaming response
   * @returns Promise that resolves when streaming is complete
   * @throws Error if message processing fails
   */
  async processMessageStream(
    messages: Message[],
    callbacks: {
      onToken: (token: string) => void;
      onComplete?: () => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> {
    try {
      logger.debug('Processing streaming chat message:', { messageCount: messages.length });

      // Format messages for the AI service
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content ?? ''
      }));

      // Get streaming response from AI service
      await this.aiService.processMessageStream(formattedMessages, {
        onToken: callbacks.onToken,
        onComplete: callbacks.onComplete,
        onError: callbacks.onError,
      });
    } catch (error) {
      logger.error('Error in chat service:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error('Unknown error in chat service'));
    }
  }

  /**
   * Updates the system prompt for the AI
   * Allows dynamic modification of the AI's behavior by updating its system prompt
   * 
   * @param newPrompt - New system prompt to use
   * @throws Error if prompt update fails
   */
  updateSystemPrompt(newPrompt: string): void {
    try {
      this.aiService.updateSystemPrompt(newPrompt);
      logger.debug('System prompt updated');
    } catch (error) {
      logger.error('Error updating system prompt:', error);
      throw error;
    }
  }
} 