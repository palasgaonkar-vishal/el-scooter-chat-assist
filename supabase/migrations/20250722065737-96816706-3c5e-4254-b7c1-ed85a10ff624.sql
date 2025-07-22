-- First, let's check if we have a way to get the current user's mobile number
-- Looking at the profiles table, we need to match customer_mobile with the user's mobile_number

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Create a new policy that allows users to see orders by their mobile number
CREATE POLICY "Users can view orders by mobile number" 
ON public.orders 
FOR SELECT 
USING (
  -- Allow if user_id matches (for future orders with user_id)
  auth.uid() = user_id 
  OR 
  -- Allow if customer_mobile matches the user's mobile number from profiles
  customer_mobile IN (
    SELECT mobile_number 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
  OR
  -- Also check without country code prefix for compatibility
  customer_mobile IN (
    SELECT '+91' || mobile_number 
    FROM public.profiles 
    WHERE id = auth.uid() AND mobile_number NOT LIKE '+91%'
  )
  OR
  -- And check with country code removed for compatibility  
  customer_mobile IN (
    SELECT REPLACE(mobile_number, '+91', '')
    FROM public.profiles 
    WHERE id = auth.uid() AND mobile_number LIKE '+91%'
  )
);