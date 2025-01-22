import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface StreamCompletionOptions {
  messages: ChatCompletionMessageParam[];
  conversationId: string;
}

export class AIService {
  static async streamCompletion({ messages, conversationId }: StreamCompletionOptions): Promise<ReadableStream<Uint8Array>> {
    try {
      // Log the request payload
      console.log('Sending chat request:', { messages, conversationId });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages, conversationId }),
      });

      if (!response.ok) {
        console.error('API error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });
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