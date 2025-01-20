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
          model: AI_CONFIG.model,
          temperature: AI_CONFIG.temperature,
          max_tokens: AI_CONFIG.max_tokens,
          top_p: AI_CONFIG.top_p,
          frequency_penalty: AI_CONFIG.frequency_penalty,
          presence_penalty: AI_CONFIG.presence_penalty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Return the response as a ReadableStream
      return response.body;
    } catch (error) {
      console.error('Error in AI service:', error);
      throw error;
    }
  }
} 