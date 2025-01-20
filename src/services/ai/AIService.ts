import OpenAI from 'openai';
import { AI_CONFIG } from '@/config/ai.config';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export class AIService {
  static async streamCompletion(messages: ChatCompletionMessageParam[]) {
    try {
      const stream = await openai.chat.completions.create({
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: AI_CONFIG.system_message,
          },
          ...messages,
        ],
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.max_tokens,
        top_p: AI_CONFIG.top_p,
        frequency_penalty: AI_CONFIG.frequency_penalty,
        presence_penalty: AI_CONFIG.presence_penalty,
        stream: true,
      });

      return stream;
    } catch (error) {
      console.error('Error in AI service:', error);
      throw error;
    }
  }
} 