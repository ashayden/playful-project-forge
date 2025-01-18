export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageSeverity = 'info' | 'error' | 'warning' | 'success';

export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
  conversation_id: string;
  user_id: string | null;
  created_at?: string;
  reactions?: any[];
  is_streaming?: boolean;
  severity?: MessageSeverity;
}

export interface MessageData {
  role: MessageRole;
  content: string;
  conversation_id: string;
  user_id: string | null;
  severity?: MessageSeverity;
}

export interface AIResponse {
  content: string;
}