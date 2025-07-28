-- Create storage bucket for page images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('page-images', 'page-images', true);

-- Create storage policies for page images
CREATE POLICY "Anyone can view page images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'page-images');

CREATE POLICY "Admins can upload page images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'page-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update page images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'page-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete page images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'page-images' AND has_role(auth.uid(), 'admin'::app_role));