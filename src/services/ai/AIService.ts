import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface StreamCompletionOptions {
  messages: ChatCompletionMessageParam[];
  conversationId?: string;
}

export class AIService {
  private static getApiUrls() {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://playful-project-forge.vercel.app'
      : '';
    
    return {
      appRouter: `${baseUrl}/api/chat`,
      pagesRouter: `${baseUrl}/api/chat.ts`,
    };
  }

  static async streamCompletion({ messages, conversationId }: StreamCompletionOptions): Promise<ReadableStream<Uint8Array>> {
    const urls = this.getApiUrls();
    let lastError: Error | null = null;

    // Try App Router endpoint first
    try {
      const response = await fetch(urls.appRouter, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages, conversationId }),
      });

      if (response.ok) {
        if (!response.body) {
          throw new Error('No response body received');
        }
        return response.body;
      }
      lastError = new Error(`App Router API failed: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('App Router attempt failed:', error);
      lastError = error as Error;
    }

    // Try Pages Router endpoint as fallback
    try {
      const response = await fetch(urls.pagesRouter, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages, conversationId }),
      });

      if (response.ok) {
        if (!response.body) {
          throw new Error('No response body received');
        }
        return response.body;
      }
      throw new Error(`Pages Router API failed: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('Pages Router attempt failed:', error);
      throw lastError || error;
    }
  }
} 