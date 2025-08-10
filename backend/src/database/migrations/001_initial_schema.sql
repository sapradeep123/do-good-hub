-- Initial Database Schema for Do Good Hub
-- Based on Supabase migrations

-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user information
CREATE TABLE profiles (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'ngo', 'vendor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NGOs table
CREATE TABLE ngos (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  mission TEXT,
  website TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  email TEXT,
  registration_number TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vendors table
CREATE TABLE vendors (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  phone TEXT,
  email TEXT,
  business_type TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create packages table
CREATE TABLE packages (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT,
  target_quantity INTEGER,
  current_quantity INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donations table
CREATE TABLE donations (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  ngo_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_title TEXT NOT NULL,
  package_amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'card',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  invoice_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table to track the full supply chain flow
CREATE TABLE transactions (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  package_id UUID NOT NULL,
  ngo_id UUID NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  donor_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
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
CREATE TABLE tickets (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
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
  assigned_to_user_id UUID REFERENCES profiles(user_id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ngos_updated_at
BEFORE UPDATE ON ngos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON packages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_ngos_user_id ON ngos(user_id);
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_packages_ngo_id ON packages(ngo_id);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_payment_status ON donations(payment_status);
CREATE INDEX idx_transactions_donor_user_id ON transactions(donor_user_id);
CREATE INDEX idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_tickets_transaction_id ON tickets(transaction_id);
CREATE INDEX idx_tickets_status ON tickets(status); 