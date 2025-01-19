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
import { 
  Message, 
  AIServiceConfig, 
  StreamCallbacks as AIStreamCallbacks,
  AIError,
  AIErrorCode
} from '@/types/ai';

export type StreamCallbacks = AIStreamCallbacks;

/**
 * Service class for handling AI interactions using Langchain
 */
export class AIService {
  private streamingModel: ChatOpenAI;
  private nonStreamingModel: ChatOpenAI;
  private prompt: ChatPromptTemplate;
  private systemPrompt: string;
  private readonly maxContextTokens: number;
  private readonly config: AIServiceConfig;

  constructor(systemPrompt: string = aiConfig.defaultPrompt) {
    this.validateEnvironment();
    this.config = modelConfig;
    
    try {
      this.maxContextTokens = this.config.contextWindow;
      this.systemPrompt = systemPrompt;
      
      this.streamingModel = this.createModel(true);
      this.nonStreamingModel = this.createModel(false);
      this.prompt = this.createPromptTemplate();
      
      logger.debug('AIService initialized successfully', {
        modelName: this.config.modelName,
        maxTokens: this.config.maxTokens,
      });
    } catch (error) {
      throw new AIError(
        'Failed to initialize AI service',
        AIErrorCode.INITIALIZATION_ERROR,
        { error },
        false
      );
    }
  }

  private validateEnvironment(): void {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new AIError(
        'OpenAI API key is not set',
        AIErrorCode.INITIALIZATION_ERROR,
        { missingKey: 'VITE_OPENAI_API_KEY' },
        false
      );
    }
  }

  private createModel(streaming: boolean): ChatOpenAI {
    return new ChatOpenAI({
      modelName: this.config.modelName,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      openAIApiKey: aiConfig.openAIApiKey,
      streaming,
      maxConcurrency: streaming ? 1 : undefined,
    });
  }

  private createPromptTemplate(): ChatPromptTemplate {
    try {
      return ChatPromptTemplate.fromMessages([
        ['system', this.systemPrompt],
        new MessagesPlaceholder('history'),
        HumanMessagePromptTemplate.fromTemplate('{input}'),
      ]);
    } catch (error) {
      throw new AIError(
        'Failed to create prompt template',
        AIErrorCode.INITIALIZATION_ERROR,
        { error },
        false
      );
    }
  }

  private convertToLangchainMessage(message: Message): BaseMessage {
    try {
      switch (message.role) {
        case 'system':
          return new SystemMessage(message.content);
        case 'assistant':
          return new AIMessage(message.content);
        case 'user':
          return new HumanMessage(message.content);
        default:
          throw new AIError(
            'Invalid message role',
            AIErrorCode.INVALID_INPUT,
            { role: message.role },
            false
          );
      }
    } catch (error) {
      throw new AIError(
        'Failed to convert message',
        AIErrorCode.INVALID_INPUT,
        { error, message },
        false
      );
    }
  }

  private truncateHistory(messages: Message[], maxTokens: number): Message[] {
    // Simple token estimation: 4 chars ~= 1 token
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);
    
    let totalTokens = estimateTokens(this.systemPrompt);
    const result: Message[] = [];
    
    // Process messages from most recent to oldest
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgTokens = estimateTokens(msg.content);
      
      if (totalTokens + msgTokens <= maxTokens) {
        result.unshift(msg);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }
    
    return result;
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AIError && !error.retryable) {
        throw error;
      }

      if (retryCount >= this.config.maxRetries) {
        throw new AIError(
          'Max retries reached',
          AIErrorCode.API_ERROR,
          { error, retryCount },
          false
        );
      }

      logger.warn(`Retry attempt ${retryCount + 1}:`, { error });
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      return this.retryOperation(operation, retryCount + 1);
    }
  }

  /**
   * Process a message and return a non-streaming response
   * @param messages - Array of messages in the conversation
   * @returns Promise containing the AI's response
   */
  async processMessage(messages: Message[]): Promise<string> {
    return this.retryOperation(async () => {
      try {
        if (!messages?.length) {
          throw new AIError(
            'No messages provided',
            AIErrorCode.INVALID_INPUT,
            undefined,
            false
          );
        }

        const availableContext = this.maxContextTokens - this.config.maxTokens;
        const truncatedMessages = this.truncateHistory(messages, availableContext);
        
        const history = truncatedMessages.slice(0, -1).map(msg => this.convertToLangchainMessage(msg));
        const currentMessage = truncatedMessages[truncatedMessages.length - 1].content;

        const chain = RunnableSequence.from([
          this.prompt,
          this.nonStreamingModel,
          new StringOutputParser(),
        ]);

        const response = await Promise.race([
          chain.invoke({
            input: currentMessage,
            history: history,
          }),
          new Promise((_, reject) => 
            setTimeout(
              () => reject(new AIError('Request timeout', AIErrorCode.TIMEOUT, undefined, true)),
              this.config.timeoutMs
            )
          )
        ]) as string;

        if (!response) {
          throw new AIError(
            'No response received',
            AIErrorCode.API_ERROR,
            undefined,
            true
          );
        }

        return response;
      } catch (error) {
        if (error instanceof AIError) {
          throw error;
        }
        throw new AIError(
          'Failed to process message',
          AIErrorCode.API_ERROR,
          { error },
          true
        );
      }
    });
  }

  async processMessageStream(
    messages: Message[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      if (!messages?.length) {
        throw new AIError(
          'No messages provided',
          AIErrorCode.INVALID_INPUT,
          undefined,
          false
        );
      }

      const availableContext = this.maxContextTokens - this.config.maxTokens;
      const truncatedMessages = this.truncateHistory(messages, availableContext);
      
      const history = truncatedMessages.slice(0, -1).map(msg => this.convertToLangchainMessage(msg));
      const currentMessage = truncatedMessages[truncatedMessages.length - 1].content;

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
          buffer += chunk;
          
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
        
        if (buffer.trim()) {
          callbacks.onToken(buffer);
        }
        
        callbacks.onComplete?.();
      } catch (error) {
        const aiError = new AIError(
          'Error in stream processing',
          AIErrorCode.API_ERROR,
          { error },
          true
        );
        callbacks.onError?.(aiError);
      }
    } catch (error) {
      const aiError = error instanceof AIError ? error : new AIError(
        'Failed to process streaming message',
        AIErrorCode.API_ERROR,
        { error },
        true
      );
      callbacks.onError?.(aiError);
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