import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export type Message = ChatCompletionMessageParam & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface AIError extends Error {
  code: string;
  retryable: boolean;
  details?: unknown;
} 