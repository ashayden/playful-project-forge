export const AI_CONFIG = {
  model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4',
  temperature: Number(process.env.NEXT_PUBLIC_OPENAI_TEMPERATURE) || 0.7,
  max_tokens: Number(process.env.NEXT_PUBLIC_OPENAI_MAX_TOKENS) || 4096,
  top_p: Number(process.env.NEXT_PUBLIC_OPENAI_TOP_P) || 1,
  frequency_penalty: Number(process.env.NEXT_PUBLIC_OPENAI_FREQUENCY_PENALTY) || 0,
  presence_penalty: Number(process.env.NEXT_PUBLIC_OPENAI_PRESENCE_PENALTY) || 0,
  stream: true,
  system_message: process.env.NEXT_PUBLIC_OPENAI_SYSTEM_MESSAGE || 'You are a helpful AI assistant. Respond concisely and accurately.',
} as const; 