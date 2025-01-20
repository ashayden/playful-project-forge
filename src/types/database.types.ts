export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          title: string
          user_id: string
          created_at: string
          updated_at: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          role: 'user' | 'assistant'
          conversation_id: string
          user_id: string | null
          created_at: string
          updated_at: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 