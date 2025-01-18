-- Add has_response column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS has_response BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing conversations to have has_response = true since they already exist
UPDATE conversations SET has_response = TRUE;

-- Ensure model column is set to gpt-4o
UPDATE conversations SET model = 'gpt-4o';

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
); 