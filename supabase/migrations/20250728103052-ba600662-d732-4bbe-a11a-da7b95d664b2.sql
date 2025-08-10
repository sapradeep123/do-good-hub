-- Add service_status column to donations table to track completion
ALTER TABLE public.donations 
ADD COLUMN service_status TEXT DEFAULT 'pending' CHECK (service_status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Add service completion date
ALTER TABLE public.donations 
ADD COLUMN service_completed_at TIMESTAMP WITH TIME ZONE;