-- Allow anyone to update FAQ analytics (view count and feedback counts)
CREATE POLICY "Anyone can update FAQ analytics" 
ON public.faqs 
FOR UPDATE 
USING (is_active = true)
WITH CHECK (
  is_active = true AND
  -- Only allow updating analytics fields - all other fields must remain unchanged
  question = question AND
  answer = answer AND
  category = category AND
  tags = tags AND
  scooter_models = scooter_models AND
  created_at = created_at
);