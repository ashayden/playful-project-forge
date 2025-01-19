-- Make model column nullable in conversations table
ALTER TABLE conversations
  ALTER COLUMN model DROP NOT NULL; 