
-- Create storage bucket for chat file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files',
  'chat-files',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
);

-- Create RLS policies for chat file uploads
CREATE POLICY "Users can upload their own chat files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view chat files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can delete their own chat files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update chat_conversations table to include session management
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS escalated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE;

-- Create chat sessions table for better session management
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS on chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions
CREATE POLICY "Users can create own chat sessions"
ON chat_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat sessions"
ON chat_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
ON chat_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_expires_at ON chat_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id ON chat_conversations(session_id);

-- Update the cleanup function to handle chat sessions
CREATE OR REPLACE FUNCTION cleanup_expired_chat_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Mark expired sessions as inactive
    UPDATE chat_sessions 
    SET is_active = FALSE, updated_at = NOW()
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    -- Delete old chat conversations (older than 24 hours)
    DELETE FROM chat_conversations 
    WHERE expires_at < NOW() - INTERVAL '23 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup event
    INSERT INTO analytics (event_type, event_data)
    VALUES ('chat_session_cleanup', jsonb_build_object('deleted_count', deleted_count));
    
    RETURN deleted_count;
END;
$$;
