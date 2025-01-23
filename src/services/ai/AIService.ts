import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface StreamCompletionOptions {
  messages: ChatCompletionMessageParam[];
  conversationId?: string;
}

export class AIService {
  private static getApiUrl() {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'http://localhost:3000';
    
    return `${baseUrl}/api/chat`;
  }

  static async streamCompletion({ messages, conversationId }: StreamCompletionOptions): Promise<ReadableStream<Uint8Array>> {
    const url = this.getApiUrl();
    console.log('Making request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ messages, conversationId }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    return response.body;
  }
} 