-- Add RLS policy to allow password reset functionality
-- This allows anyone to check if an email exists in profiles for password reset
CREATE POLICY "Allow email lookup for password reset" 
ON public.profiles 
FOR SELECT 
USING (true);