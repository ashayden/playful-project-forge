import { AI_CONFIG } from '@/config/ai.config';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  static async streamCompletion(messages: ChatCompletionMessageParam[]) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          conversationId: 'temp-id', // This should be provided by the caller
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get AI response');
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