-- Update RLS policies for packages table
-- Remove NGO's ability to create packages, only allow view and update

-- Drop the existing policy that allows NGOs to manage all their packages
DROP POLICY IF EXISTS "NGOs can manage their own packages" ON public.packages;

-- Create separate policies for NGOs: they can only view and update, not create or delete
CREATE POLICY "NGOs can view their own packages" 
ON public.packages 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM ngos
  WHERE ngos.id = packages.ngo_id AND ngos.user_id = auth.uid()
));

CREATE POLICY "NGOs can update their own packages" 
ON public.packages 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM ngos
  WHERE ngos.id = packages.ngo_id AND ngos.user_id = auth.uid()
));