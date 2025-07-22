-- Reset FAQ statistics based on specified thresholds

-- Reset view_count to 0 where it's above 100
UPDATE public.faqs 
SET view_count = 0 
WHERE view_count > 100;

-- Reset helpful_count to 0 where it's above 10
UPDATE public.faqs 
SET helpful_count = 0 
WHERE helpful_count > 10;

-- Reset not_helpful_count to 0 where it's above 5
UPDATE public.faqs 
SET not_helpful_count = 0 
WHERE not_helpful_count > 5;