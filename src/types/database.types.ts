export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          preferences: Record<string, any>;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferences?: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          preferences?: Record<string, any>;
        };
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string | null;
          user_id: string;
          model: string;
          has_response: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string | null;
          user_id: string;
          model: string;
          has_response?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string | null;
          user_id?: string;
          model?: string;
          has_response?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          content: string;
          role: 'user' | 'assistant' | 'system';
          conversation_id: string;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          content: string;
          role: 'user' | 'assistant' | 'system';
          conversation_id: string;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          content?: string;
          role?: 'user' | 'assistant' | 'system';
          conversation_id?: string;
          user_id?: string | null;
        };
      };
    };
  };
} 