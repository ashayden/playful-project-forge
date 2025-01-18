/**
 * AI Model Configuration
 * Defines the core settings for the AI model used in the application
 * 
 * @property modelName - The specific model to use (gpt-4o-mini-2024-07-18)
 * @property temperature - Controls randomness in responses (0.0 to 1.0)
 * @property maxTokens - Maximum length of generated responses (16k limit)
 * @property contextWindow - Maximum context window size (128k tokens)
 */
export const modelConfig = {
  modelName: 'gpt-4o-mini-2024-07-18',
  temperature: 0.7,
  maxTokens: 8192,
  contextWindow: 128000,
} as const;

/**
 * Default System Prompt
 * Defines the base personality and behavior of the AI assistant
 * This prompt is used as the initial context for all conversations
 * 
 * The prompt instructs the AI to:
 * - Provide clear and concise responses
 * - Maintain professional and friendly communication
 * - Acknowledge uncertainty when appropriate
 * - Use proper formatting for code and technical content
 */
export const defaultSystemPrompt = `You are a helpful AI assistant. 
You provide clear, concise, and accurate responses.
You maintain a professional and friendly tone.
If you're unsure about something, you acknowledge the uncertainty.
You format code blocks and technical content appropriately.`;

/**
 * Environment Configuration
 * Contains environment-specific settings and API keys
 * 
 * @property openAIApiKey - API key for OpenAI services (from environment variables)
 * @property model - Fixed model configuration settings
 * @property defaultPrompt - Default system prompt for the AI
 */
export const aiConfig = {
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  model: modelConfig,
  defaultPrompt: defaultSystemPrompt,
} as const; 