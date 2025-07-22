-- Update the RLS policy to handle all mobile number format variations
DROP POLICY IF EXISTS "Users can view orders by mobile number" ON public.orders;

CREATE POLICY "Users can view orders by mobile number" 
ON public.orders 
FOR SELECT 
USING (
  -- Allow if user_id matches (for future orders with user_id)
  auth.uid() = user_id 
  OR 
  -- More comprehensive mobile number matching
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND (
      -- Direct match
      customer_mobile = p.mobile_number
      OR
      -- Match with +91 prefix added to profile number (if profile doesn't have +91)
      customer_mobile = ('+91' || p.mobile_number) AND p.mobile_number NOT LIKE '+91%'
      OR
      -- Match with +91 prefix removed from profile number (if profile has +91)
      customer_mobile = REPLACE(p.mobile_number, '+91', '') AND p.mobile_number LIKE '+91%'
      OR
      -- Match order number with +91 added (if order doesn't have +91)
      ('+91' || customer_mobile) = p.mobile_number AND customer_mobile NOT LIKE '+91%'
      OR
      -- Match order number with +91 removed (if order has +91) 
      REPLACE(customer_mobile, '+91', '') = REPLACE(p.mobile_number, '+91', '')
    )
  )
);