import { AI_CONFIG } from '@/config/ai.config';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  static async streamCompletion(messages: ChatCompletionMessageParam[]) {
    try {
      const payload = {
        messages,
        conversationId: crypto.randomUUID(),
      };
      
      console.log('Sending chat request with payload:', {
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1],
        conversationId: payload.conversationId,
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify(payload),
      });

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
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