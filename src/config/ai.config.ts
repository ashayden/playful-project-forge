export const AI_CONFIG = {
  model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o',
  temperature: Number(import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.7,
  max_tokens: Number(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 4096,
  top_p: Number(import.meta.env.VITE_OPENAI_TOP_P) || 1,
  frequency_penalty: Number(import.meta.env.VITE_OPENAI_FREQUENCY_PENALTY) || 0,
  presence_penalty: Number(import.meta.env.VITE_OPENAI_PRESENCE_PENALTY) || 0,
  stream: true,
  system_message: import.meta.env.VITE_OPENAI_SYSTEM_MESSAGE || 'You are a helpful AI assistant. Respond concisely and accurately.',
} as const; 