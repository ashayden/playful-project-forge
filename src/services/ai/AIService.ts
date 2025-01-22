import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface StreamCompletionOptions {
  messages: ChatCompletionMessageParam[];
  conversationId?: string;
}

export class AIService {
  private static API_URL = '/api/chat';

  static async streamCompletion({ messages, conversationId }: StreamCompletionOptions): Promise<ReadableStream<Uint8Array>> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, conversationId }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      return response.body;
    } catch (error) {
      console.error('Stream completion error:', error);
      throw error;
    }
  }
} 