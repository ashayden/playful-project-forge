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
import { aiConfig, modelConfig } from '@/config/ai.config';
import { logger } from '@/services/loggingService';

/**
 * Service class for handling AI interactions using Langchain
 */
export class AIService {
  private model: ChatOpenAI;
  private prompt: ChatPromptTemplate;
  private systemPrompt: string;

  constructor(systemPrompt: string = 'You are a helpful AI assistant.') {
    // Log all environment variables (without their values)
    logger.debug('Environment variables check:', { 
      hasOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    });

    logger.debug('Initializing AIService with config:', { 
      modelName: modelConfig.modelName,
      hasApiKey: !!aiConfig.openAIApiKey,
      systemPrompt,
      environment: import.meta.env.MODE
    });

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      const error = new Error('OpenAI API key is not set in environment variables');
      logger.error('Environment variable error:', error);
      throw error;
    }

    if (!aiConfig.openAIApiKey) {
      const error = new Error('OpenAI API key is not configured in aiConfig');
      logger.error('Configuration error:', error);
      throw error;
    }

    try {
      // Initialize the OpenAI model with fixed configuration
      this.model = new ChatOpenAI({
        modelName: modelConfig.modelName,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        openAIApiKey: aiConfig.openAIApiKey,
      });

      this.systemPrompt = systemPrompt;
      this.prompt = this.createPromptTemplate();
      logger.debug('AIService initialized successfully');
    } catch (error) {
      logger.error('Error initializing AIService:', error);
      throw new Error(`Failed to initialize AI service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createPromptTemplate(): ChatPromptTemplate {
    try {
      return ChatPromptTemplate.fromMessages([
        ['system', this.systemPrompt],
        new MessagesPlaceholder('history'),
        HumanMessagePromptTemplate.fromTemplate('{input}'),
      ]);
    } catch (error) {
      logger.error('Error creating prompt template:', error);
      throw error;
    }
  }

  private convertToLangchainMessage(message: { role: string; content: string }): BaseMessage {
    try {
      switch (message.role) {
        case 'system':
          return new SystemMessage(message.content);
        case 'assistant':
          return new AIMessage(message.content);
        case 'user':
        default:
          return new HumanMessage(message.content);
      }
    } catch (error) {
      logger.error('Error converting message:', error);
      throw error;
    }
  }

  async processMessage(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      if (!messages || messages.length === 0) {
        throw new Error('No messages provided');
      }

      logger.debug('Processing message with history:', { 
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]?.content,
        roles: messages.map(m => m.role)
      });

      // Convert messages to Langchain format
      const history = messages.slice(0, -1).map(msg => this.convertToLangchainMessage(msg));
      const currentMessage = messages[messages.length - 1].content;

      logger.debug('Creating conversation chain');
      const chain = RunnableSequence.from([
        this.prompt,
        this.model,
        new StringOutputParser(),
      ]);

      logger.debug('Invoking chain with input:', { 
        currentMessage,
        historyLength: history.length,
        systemPrompt: this.systemPrompt
      });

      const response = await chain.invoke({
        input: currentMessage,
        history: history,
      });

      if (!response) {
        throw new Error('No response received from AI');
      }

      logger.debug('Received response from chain:', { 
        responseLength: response.length,
        responsePreview: response.substring(0, 100)
      });
      
      return response;
    } catch (error) {
      logger.error('Error processing message:', error);
      throw new Error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  updateSystemPrompt(newPrompt: string): void {
    try {
      logger.debug('Updating system prompt:', { newPrompt });
      this.systemPrompt = newPrompt;
      this.prompt = this.createPromptTemplate();
    } catch (error) {
      logger.error('Error updating system prompt:', error);
      throw error;
    }
  }
} 