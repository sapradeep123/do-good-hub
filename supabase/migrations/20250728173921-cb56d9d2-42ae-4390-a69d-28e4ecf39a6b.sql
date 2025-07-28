-- Drop the existing ngo_id column from vendors table
ALTER TABLE public.vendors DROP COLUMN IF EXISTS ngo_id;

-- Create junction table for many-to-many relationship between vendors and NGOs
CREATE TABLE public.vendor_ngo_associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, ngo_id)
);

-- Enable RLS
ALTER TABLE public.vendor_ngo_associations ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_ngo_associations
CREATE POLICY "Admins can manage all vendor NGO associations" 
ON public.vendor_ngo_associations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can view their own associations" 
ON public.vendor_ngo_associations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM vendors 
  WHERE vendors.id = vendor_ngo_associations.vendor_id 
  AND vendors.user_id = auth.uid()
));

CREATE POLICY "NGOs can view their associations" 
ON public.vendor_ngo_associations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ngos 
  WHERE ngos.id = vendor_ngo_associations.ngo_id 
  AND ngos.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_vendor_ngo_associations_updated_at
BEFORE UPDATE ON public.vendor_ngo_associations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update purchase_orders to work with the new association structure
-- The ngo_id in purchase_orders will be determined by the donation's target NGO