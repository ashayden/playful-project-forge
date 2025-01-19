/**
 * AI Service Types
 * Core type definitions for AI service functionality
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface AIServiceConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  timeoutMs: number;
  maxRetries: number;
  retryDelay: number;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface AIServiceError extends Error {
  code: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export class AIError extends Error implements AIServiceError {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export enum AIErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  CONTEXT_OVERFLOW = 'CONTEXT_OVERFLOW',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
} 