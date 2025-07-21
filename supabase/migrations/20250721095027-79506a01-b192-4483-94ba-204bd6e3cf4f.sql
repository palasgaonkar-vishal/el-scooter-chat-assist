-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('faq_confidence_threshold', '0.7', 'Minimum confidence score for FAQ matches'),
  ('chat_session_timeout', '3600', 'Chat session timeout in seconds (1 hour)'),
  ('escalation_auto_threshold', '0.3', 'Confidence score below which queries are auto-escalated')
ON CONFLICT (setting_key) DO NOTHING;