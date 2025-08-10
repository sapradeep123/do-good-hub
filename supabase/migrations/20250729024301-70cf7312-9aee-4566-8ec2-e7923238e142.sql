-- Create transactions table to track the full supply chain flow
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id UUID NOT NULL,
  package_id UUID NOT NULL,
  ngo_id UUID NOT NULL,
  vendor_id UUID,
  donor_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_admin_assignment' CHECK (status IN (
    'pending_admin_assignment',
    'assigned_to_vendor', 
    'vendor_processing',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'issue_reported'
  )),
  tracking_number TEXT,
  delivery_note_url TEXT,
  invoice_url TEXT,
  admin_notes TEXT,
  vendor_notes TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tickets table for issue tracking
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL CHECK (category IN (
    'delivery_delay',
    'quality_issue', 
    'missing_items',
    'wrong_delivery',
    'invoice_issue',
    'tracking_issue',
    'other'
  )),
  assigned_to_user_id UUID,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Donors can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = donor_user_id);

CREATE POLICY "Admins can manage all transactions" 
ON public.transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can view and update their assigned transactions" 
ON public.transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM vendors 
  WHERE vendors.id = transactions.vendor_id 
  AND vendors.user_id = auth.uid()
));

CREATE POLICY "Vendors can update their assigned transactions" 
ON public.transactions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM vendors 
  WHERE vendors.id = transactions.vendor_id 
  AND vendors.user_id = auth.uid()
));

CREATE POLICY "NGOs can view transactions for their packages" 
ON public.transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ngos 
  WHERE ngos.id = transactions.ngo_id 
  AND ngos.user_id = auth.uid()
));

-- RLS policies for tickets
CREATE POLICY "Users can view tickets they created or are assigned to" 
ON public.tickets 
FOR SELECT 
USING (
  auth.uid() = created_by_user_id 
  OR auth.uid() = assigned_to_user_id
  OR EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = tickets.transaction_id 
    AND t.donor_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tickets for their transactions" 
ON public.tickets 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by_user_id
  AND EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.id = tickets.transaction_id 
    AND (t.donor_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vendors v 
      WHERE v.id = t.vendor_id AND v.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Admins can manage all tickets" 
ON public.tickets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Assigned users can update ticket status and notes" 
ON public.tickets 
FOR UPDATE 
USING (auth.uid() = assigned_to_user_id OR auth.uid() = created_by_user_id);

-- Create storage bucket for delivery documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('delivery-documents', 'delivery-documents', false);

-- Storage policies for delivery documents
CREATE POLICY "Users can view their own delivery documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'delivery-documents' 
  AND (
    -- Donors can view their transaction documents
    (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM transactions t WHERE t.donor_user_id = auth.uid()
    )
    OR 
    -- Vendors can view documents for their transactions
    (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM transactions t 
      JOIN vendors v ON v.id = t.vendor_id 
      WHERE v.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Vendors can upload documents for their transactions" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'delivery-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text FROM transactions t 
    JOIN vendors v ON v.id = t.vendor_id 
    WHERE v.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all delivery documents" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'delivery-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_transactions_donor_user_id ON public.transactions(donor_user_id);
CREATE INDEX idx_transactions_vendor_id ON public.transactions(vendor_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_tickets_transaction_id ON public.tickets(transaction_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);