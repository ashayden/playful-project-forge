import { AI_CONFIG } from '@/config/ai.config';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  static async streamCompletion(messages: ChatCompletionMessageParam[]) {
    try {
      console.log('Sending request to chat API...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify({
          messages,
          conversationId: crypto.randomUUID(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        });
        throw new Error(`API error: ${response.status} - ${errorData}`);
      }

      if (!response.body) {
        throw new Error('No response stream available');
      }

      return response.body;
    } catch (error) {
      console.error('Error in AI service:', error);
      throw error;
    }
  }
} 