-- Enable realtime for escalated_queries table to support notifications
ALTER TABLE public.escalated_queries REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
INSERT INTO supabase_realtime.subscription (publication, claims) VALUES ('supabase_realtime', '{"role": "authenticated"}');

-- Ensure escalated_queries is included in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.escalated_queries;