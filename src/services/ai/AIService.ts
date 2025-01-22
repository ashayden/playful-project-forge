import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface StreamCompletionOptions {
  messages: ChatCompletionMessageParam[];
  conversationId?: string;
}

export class AIService {
  private static getApiUrls() {
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://playful-project-forge.vercel.app'
      : 'http://localhost:3000';
    
    return {
      appRouter: `${baseUrl}/api/chat`,
      pagesRouter: `${baseUrl}/api/pages-chat`,
    };
  }

  static async streamCompletion({ messages, conversationId }: StreamCompletionOptions): Promise<ReadableStream<Uint8Array>> {
    const urls = this.getApiUrls();
    let lastError: Error | null = null;

    // Try App Router endpoint first
    try {
      console.log('Trying App Router endpoint:', urls.appRouter);
      const response = await fetch(urls.appRouter, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages, conversationId }),
      });

      console.log('App Router response status:', response.status);
      
      if (response.ok) {
        if (!response.body) {
          throw new Error('No response body received');
        }
        return response.body;
      }
      
      const errorText = await response.text();
      console.error('App Router error response:', errorText);
      lastError = new Error(`App Router API failed: ${response.status} ${response.statusText} - ${errorText}`);
    } catch (error) {
      console.error('App Router attempt failed:', error);
      lastError = error as Error;
    }

    // Try Pages Router endpoint as fallback
    try {
      console.log('Trying Pages Router endpoint:', urls.pagesRouter);
      const response = await fetch(urls.pagesRouter, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages, conversationId }),
      });

      console.log('Pages Router response status:', response.status);

      if (response.ok) {
        if (!response.body) {
          throw new Error('No response body received');
        }
        return response.body;
      }

      const errorText = await response.text();
      console.error('Pages Router error response:', errorText);
      throw new Error(`Pages Router API failed: ${response.status} ${response.statusText} - ${errorText}`);
    } catch (error) {
      console.error('Pages Router attempt failed:', error);
      throw lastError || error;
    }
  }
} 