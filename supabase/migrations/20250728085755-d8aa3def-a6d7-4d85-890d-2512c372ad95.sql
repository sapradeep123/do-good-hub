-- Create table for page content management
CREATE TABLE public.page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL UNIQUE, -- 'how-it-works', 'about', 'contact-us'
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of content blocks
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all page content" 
ON public.page_content 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view published pages" 
ON public.page_content 
FOR SELECT 
USING (is_published = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content for the three pages
INSERT INTO public.page_content (page_slug, title, content) VALUES 
('how-it-works', 'How It Works', '[
  {
    "type": "heading",
    "content": "How CareFund Works"
  },
  {
    "type": "paragraph", 
    "content": "CareFund connects donors with verified NGOs to create meaningful impact in communities worldwide."
  },
  {
    "type": "steps",
    "content": [
      {"step": 1, "title": "Browse NGOs", "description": "Explore verified organizations working on causes you care about"},
      {"step": 2, "title": "Choose Packages", "description": "Select donation packages that align with your giving goals"},
      {"step": 3, "title": "Make Impact", "description": "Track your donations and see the difference you''re making"}
    ]
  }
]'::jsonb),
('about', 'About Us', '[
  {
    "type": "heading",
    "content": "About CareFund"
  },
  {
    "type": "paragraph",
    "content": "We are a platform dedicated to connecting generous donors with impactful NGOs around the world."
  },
  {
    "type": "paragraph",
    "content": "Our mission is to make giving transparent, efficient, and meaningful for everyone involved."
  }
]'::jsonb),
('contact-us', 'Contact Us', '[
  {
    "type": "heading", 
    "content": "Get in Touch"
  },
  {
    "type": "paragraph",
    "content": "We would love to hear from you. Reach out to us for any questions or support."
  },
  {
    "type": "contact_info",
    "content": {
      "email": "support@carefund.org",
      "phone": "+1 (555) 123-4567",
      "address": "123 Impact Street, Giving City, GC 12345"
    }
  }
]'::jsonb);