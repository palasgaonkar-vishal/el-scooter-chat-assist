-- Fix the RLS policy to properly handle mobile number formats
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
      -- Handle case: order has 91XXXXXXXX, profile has +91XXXXXXXX
      customer_mobile = REPLACE(p.mobile_number, '+91', '91') 
      OR
      -- Handle case: order has +91XXXXXXXX, profile has 91XXXXXXXX  
      customer_mobile = ('+91' || REPLACE(p.mobile_number, '91', '')) AND p.mobile_number LIKE '91%' AND p.mobile_number NOT LIKE '+91%'
      OR
      -- Handle case: order has 91XXXXXXXX, profile has 91XXXXXXXX (both without +)
      REPLACE(customer_mobile, '91', '') = REPLACE(p.mobile_number, '91', '') AND customer_mobile LIKE '91%' AND customer_mobile NOT LIKE '+91%' AND p.mobile_number LIKE '91%' AND p.mobile_number NOT LIKE '+91%'
      OR
      -- Handle case: both have +91 prefix but different afterwards
      REPLACE(customer_mobile, '+91', '') = REPLACE(p.mobile_number, '+91', '')
    )
  )
);