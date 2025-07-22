-- Enable realtime for escalated_queries table to support notifications
ALTER TABLE public.escalated_queries REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalated_queries;