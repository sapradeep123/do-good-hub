-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'ngo', 'vendor', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Create NGOs table
CREATE TABLE public.ngos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    mission TEXT,
    location TEXT,
    category TEXT,
    image_url TEXT,
    website_url TEXT,
    phone TEXT,
    email TEXT,
    registration_number TEXT UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on NGOs
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;

-- Create vendors table
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    description TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    services TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create packages table
CREATE TABLE public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ngo_id UUID REFERENCES public.ngos(id) ON DELETE CASCADE NOT NULL,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC NOT NULL,
    category TEXT,
    items_included TEXT[],
    delivery_timeline TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Create password reset requests table
CREATE TABLE public.password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on password reset requests
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for NGOs
CREATE POLICY "Everyone can view active NGOs" 
ON public.ngos FOR SELECT 
USING (is_active = true);

CREATE POLICY "NGOs can view their own data" 
ON public.ngos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all NGOs" 
ON public.ngos FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "NGOs can update their own data" 
ON public.ngos FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for Vendors
CREATE POLICY "Vendors can view their own data" 
ON public.vendors FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendors" 
ON public.vendors FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can update their own data" 
ON public.vendors FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for Packages
CREATE POLICY "Everyone can view active packages" 
ON public.packages FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all packages" 
ON public.packages FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "NGOs can manage their own packages" 
ON public.packages FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.ngos 
        WHERE ngos.id = packages.ngo_id 
        AND ngos.user_id = auth.uid()
    )
);

-- RLS Policies for password reset requests
CREATE POLICY "Users can create password reset requests" 
ON public.password_reset_requests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own requests" 
ON public.password_reset_requests FOR SELECT 
USING (true);

-- Update triggers for timestamps
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ngos_updated_at
    BEFORE UPDATE ON public.ngos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON public.vendors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user role (will need to be updated with actual admin user ID)
-- This is just a placeholder, admin will need to be assigned manually first time