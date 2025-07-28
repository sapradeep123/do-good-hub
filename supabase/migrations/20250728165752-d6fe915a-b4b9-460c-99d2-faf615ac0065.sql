-- Add NGO association to vendors table
ALTER TABLE public.vendors ADD COLUMN ngo_id UUID REFERENCES public.ngos(id);

-- Create index for better performance
CREATE INDEX idx_vendors_ngo_id ON public.vendors(ngo_id);

-- Create purchase_orders table for vendor POs
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id),
  package_id UUID NOT NULL REFERENCES public.packages(id),
  donation_id UUID NOT NULL REFERENCES public.donations(id),
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchase_orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase_orders
CREATE POLICY "Vendors can view their own purchase orders"
ON public.purchase_orders
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vendors
  WHERE vendors.id = purchase_orders.vendor_id
  AND vendors.user_id = auth.uid()
));

CREATE POLICY "NGOs can view their purchase orders"
ON public.purchase_orders
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ngos
  WHERE ngos.id = purchase_orders.ngo_id
  AND ngos.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all purchase orders"
ON public.purchase_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create vendor_invoices table for GST invoices and delivery notes
CREATE TABLE public.vendor_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  invoice_number TEXT NOT NULL,
  gst_number TEXT,
  invoice_type TEXT NOT NULL DEFAULT 'gst_invoice', -- 'gst_invoice' or 'delivery_note'
  invoice_amount NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  invoice_date DATE NOT NULL,
  delivery_date DATE,
  items JSONB,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vendor_invoices
ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_invoices
CREATE POLICY "Vendors can manage their own invoices"
ON public.vendor_invoices
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.vendors
  WHERE vendors.id = vendor_invoices.vendor_id
  AND vendors.user_id = auth.uid()
));

CREATE POLICY "NGOs can view invoices for their orders"
ON public.vendor_invoices
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.purchase_orders po
  JOIN public.ngos n ON n.id = po.ngo_id
  WHERE po.id = vendor_invoices.purchase_order_id
  AND n.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all invoices"
ON public.vendor_invoices
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_invoices_updated_at
BEFORE UPDATE ON public.vendor_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_purchase_orders_vendor_id ON public.purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_ngo_id ON public.purchase_orders(ngo_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_vendor_invoices_purchase_order_id ON public.vendor_invoices(purchase_order_id);
CREATE INDEX idx_vendor_invoices_vendor_id ON public.vendor_invoices(vendor_id);
CREATE INDEX idx_vendor_invoices_status ON public.vendor_invoices(status);