import { AIService } from './AIService';
import { aiConfig } from '@/config/ai.config';
import { Message } from '@/types/messages';
import { logger } from '@/services/loggingService';

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
   * Processes a chat message and generates a response
   * Takes the conversation history and current message, formats them appropriately,
   * sends them to the AI service, and handles any errors that occur
   * 
   * @param messages - Array of messages in the conversation
   * @returns Promise containing the AI's response
   * @throws Error if message processing fails
   */
  async processMessage(messages: Message[]): Promise<string> {
    try {
      logger.debug('Processing chat message:', { messageCount: messages.length });

      // Format messages for the AI service
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get response from AI service
      const response = await this.aiService.processMessage(formattedMessages);
      logger.debug('AI response received');

      return response;
    } catch (error) {
      logger.error('Error in chat service:', error);
      throw error;
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