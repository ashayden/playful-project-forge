-- Drop existing triggers, functions and table if they exist
DROP TABLE IF EXISTS profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS set_updated_at();

-- First, create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::JSONB
);

-- Add foreign key constraint
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Create user creation trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Migrate existing users
INSERT INTO profiles (id, email)
SELECT id, email 
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Update conversations table to ensure user_id references auth.users
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_user_id_fkey,
  ADD CONSTRAINT conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Add typing_status to conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS typing_status JSONB DEFAULT '{}'::JSONB;

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Add streaming status to messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_streaming BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stream_error TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stream_status TEXT DEFAULT 'pending'
  CHECK (stream_status IN ('pending', 'streaming', 'completed', 'error'));

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON messages;

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Create an index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id);

-- Create an index for faster message lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id);

-- Enable realtime for all tables (just set REPLICA IDENTITY)
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Note: Tables will be added to supabase_realtime publication automatically by Supabase