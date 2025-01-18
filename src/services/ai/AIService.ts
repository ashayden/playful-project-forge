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

export type StreamCallbacks = {
  onToken: (token: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Service class for handling AI interactions using Langchain
 */
export class AIService {
  private streamingModel: ChatOpenAI;
  private nonStreamingModel: ChatOpenAI;
  private prompt: ChatPromptTemplate;
  private systemPrompt: string;
  private readonly maxContextTokens: number;

  constructor(systemPrompt: string = `You are a helpful AI assistant. Please follow these guidelines:
1. Use complete, well-formed sentences
2. When using numbered lists, ensure proper formatting (1., 2., etc.)
3. Avoid abbreviations unless explicitly requested
4. Double-check sentence structure before responding
5. Use proper punctuation and spacing`) {
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
      environment: import.meta.env.MODE,
      maxTokens: modelConfig.maxTokens,
      contextWindow: modelConfig.contextWindow
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
      this.maxContextTokens = modelConfig.contextWindow;
      
      // Initialize streaming model
      this.streamingModel = new ChatOpenAI({
        modelName: modelConfig.modelName,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        openAIApiKey: aiConfig.openAIApiKey,
        streaming: true,
        maxConcurrency: 1, // Ensure sequential processing
      });

      // Initialize non-streaming model
      this.nonStreamingModel = new ChatOpenAI({
        modelName: modelConfig.modelName,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        openAIApiKey: aiConfig.openAIApiKey,
        streaming: false,
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

  private truncateHistory(messages: Array<{ role: string; content: string }>, maxTokens: number): Array<{ role: string; content: string }> {
    // Simple token estimation: 4 chars ~= 1 token
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);
    
    let totalTokens = estimateTokens(this.systemPrompt);
    const result = [];
    
    // Process messages from most recent to oldest
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgTokens = estimateTokens(msg.content);
      
      if (totalTokens + msgTokens <= maxTokens) {
        result.unshift(msg); // Add to start of array to maintain order
        totalTokens += msgTokens;
      } else {
        break;
      }
    }
    
    return result;
  }

  /**
   * Process a message and return a non-streaming response
   * @param messages - Array of messages in the conversation
   * @returns Promise containing the AI's response
   */
  async processMessage(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      if (!messages || messages.length === 0) {
        throw new Error('No messages provided');
      }

      // Calculate available context space (leaving room for response)
      const availableContext = this.maxContextTokens - modelConfig.maxTokens;
      
      // Truncate history if needed
      const truncatedMessages = this.truncateHistory(messages, availableContext);
      
      logger.debug('Processing message with history:', { 
        originalMessageCount: messages.length,
        truncatedMessageCount: truncatedMessages.length,
        lastMessage: truncatedMessages[truncatedMessages.length - 1]?.content,
        roles: truncatedMessages.map(m => m.role)
      });

      // Convert messages to Langchain format
      const history = truncatedMessages.slice(0, -1).map(msg => this.convertToLangchainMessage(msg));
      const currentMessage = truncatedMessages[truncatedMessages.length - 1].content;

      logger.debug('Creating conversation chain');
      const chain = RunnableSequence.from([
        this.prompt,
        this.nonStreamingModel, // Use non-streaming model
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

  async processMessageStream(
    messages: Array<{ role: string; content: string }>,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      if (!messages || messages.length === 0) {
        throw new Error('No messages provided');
      }

      // Calculate available context space (leaving room for response)
      const availableContext = this.maxContextTokens - modelConfig.maxTokens;
      
      // Truncate history if needed
      const truncatedMessages = this.truncateHistory(messages, availableContext);
      
      logger.debug('Processing streaming message with history:', { 
        originalMessageCount: messages.length,
        truncatedMessageCount: truncatedMessages.length,
        lastMessage: truncatedMessages[truncatedMessages.length - 1]?.content,
        roles: truncatedMessages.map(m => m.role)
      });

      // Convert messages to Langchain format
      const history = truncatedMessages.slice(0, -1).map(msg => this.convertToLangchainMessage(msg));
      const currentMessage = truncatedMessages[truncatedMessages.length - 1].content;

      logger.debug('Creating streaming conversation chain');
      const chain = RunnableSequence.from([
        this.prompt,
        this.streamingModel,
        new StringOutputParser(),
      ]);

      let buffer = '';
      const stream = await chain.stream({
        input: currentMessage,
        history: history,
      });

      try {
        for await (const chunk of stream) {
          // Add chunk to buffer
          buffer += chunk;
          
          // Look for natural break points (end of sentences, end of lines)
          const breakMatch = buffer.match(/([.!?]\s+|[\n]\s*)/);
          
          if (breakMatch) {
            const breakPoint = breakMatch.index! + breakMatch[0].length;
            const completeText = buffer.slice(0, breakPoint);
            
            if (completeText.trim()) {
              callbacks.onToken(completeText);
            }
            
            buffer = buffer.slice(breakPoint);
          }
        }
        
        // Send any remaining text in the buffer
        if (buffer.trim()) {
          callbacks.onToken(buffer);
        }
        
        callbacks.onComplete?.();
      } catch (error) {
        logger.error('Error in stream processing:', error);
        callbacks.onError?.(error instanceof Error ? error : new Error('Unknown streaming error'));
      }
    } catch (error) {
      logger.error('Error processing streaming message:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error('Failed to process streaming message'));
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