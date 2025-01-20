export const AI_CONFIG = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  stream: true,
  system_message: 'You are a helpful AI assistant. Respond concisely and accurately.',
} as const; 