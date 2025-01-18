export interface Database {
  public: {
    Tables: {
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
    };
  };
} 