-- Add UPDATE policy for chat_conversations so users can update their own conversations
CREATE POLICY "Users can update own conversations" 
ON public.chat_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);