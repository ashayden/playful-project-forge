import { ChatOpenAI } from '@langchain/openai';
import { 
  ChatPromptTemplate, 
  MessagesPlaceholder, 
  HumanMessagePromptTemplate 
} from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { 
  BaseMessage,
  HumanMessage, 
  AIMessage, 
  SystemMessage 
} from '@langchain/core/messages';
import { modelConfig } from '@/config/ai.config';

/**
 * Service class for handling AI interactions using Langchain
 * This service provides a clean interface for chat-based interactions with the AI model
 * using Langchain's conversation chain pattern.
 */
export class AIService {
  private model: ChatOpenAI;
  private prompt: ChatPromptTemplate;
  private systemPrompt: string;

  /**
   * Creates an instance of AIService
   * Initializes the AI model with the specified configuration and sets up the conversation chain
   * 
   * @param systemPrompt - Initial system prompt that sets the context and behavior of the AI
   */
  constructor(systemPrompt: string = 'You are a helpful AI assistant.') {
    // Initialize the OpenAI model with fixed configuration
    this.model = new ChatOpenAI({
      modelName: modelConfig.modelName,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
    });

    this.systemPrompt = systemPrompt;
    this.prompt = this.createPromptTemplate();
  }

  /**
   * Creates the conversation prompt template
   * Sets up the template that structures how messages are formatted for the AI
   * 
   * @private
   * @returns A configured ChatPromptTemplate
   */
  private createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      ['system', this.systemPrompt],
      new MessagesPlaceholder('history'),
      HumanMessagePromptTemplate.fromTemplate('{input}'),
    ]);
  }

  /**
   * Converts a message to Langchain's BaseMessage format
   * Handles different message roles (system, assistant, user) appropriately
   * 
   * @private
   * @param message - Message object containing role and content
   * @returns Langchain BaseMessage instance
   */
  private convertToLangchainMessage(message: { role: string; content: string }): BaseMessage {
    switch (message.role) {
      case 'system':
        return new SystemMessage(message.content);
      case 'assistant':
        return new AIMessage(message.content);
      case 'user':
      default:
        return new HumanMessage(message.content);
    }
  }

  /**
   * Processes a conversation and generates a response
   * Takes an array of messages representing the conversation history and current message,
   * processes them through the conversation chain, and returns the AI's response
   * 
   * @param messages - Array of messages in the conversation
   * @returns Promise containing the AI's response as a string
   * @throws Error if message processing fails
   */
  async processMessage(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      // Convert messages to Langchain format
      const history = messages.slice(0, -1).map(this.convertToLangchainMessage);
      const currentMessage = messages[messages.length - 1].content;

      // Create and process the conversation chain
      const chain = RunnableSequence.from([
        this.prompt,
        this.model,
        new StringOutputParser(),
      ]);

      const response = await chain.invoke({
        input: currentMessage,
        history: history,
      });

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      throw new Error('Failed to process message');
    }
  }

  /**
   * Updates the system prompt and recreates the prompt template
   * This allows dynamic modification of the AI's behavior and context
   * 
   * @param newPrompt - New system prompt to use
   */
  updateSystemPrompt(newPrompt: string): void {
    this.systemPrompt = newPrompt;
    this.prompt = this.createPromptTemplate();
  }
} 