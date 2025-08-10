-- Create sample users with different roles for testing
-- Note: These are development sample users with simple passwords

-- Sample NGO User 1
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  confirmation_token,
  email_confirm_token_sent_at
) VALUES (
  gen_random_uuid(),
  'ngo1@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Sarah", "last_name": "Johnson"}',
  '',
  now()
) ON CONFLICT (email) DO NOTHING;

-- Sample NGO User 2
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  confirmation_token,
  email_confirm_token_sent_at
) VALUES (
  gen_random_uuid(),
  'ngo2@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Michael", "last_name": "Chen"}',
  '',
  now()
) ON CONFLICT (email) DO NOTHING;

-- Sample Vendor User 1
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  confirmation_token,
  email_confirm_token_sent_at
) VALUES (
  gen_random_uuid(),
  'vendor1@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "David", "last_name": "Wilson"}',
  '',
  now()
) ON CONFLICT (email) DO NOTHING;

-- Sample Vendor User 2
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  confirmation_token,
  email_confirm_token_sent_at
) VALUES (
  gen_random_uuid(),
  'vendor2@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Lisa", "last_name": "Martinez"}',
  '',
  now()
) ON CONFLICT (email) DO NOTHING;

-- Sample Regular User
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  confirmation_token,
  email_confirm_token_sent_at
) VALUES (
  gen_random_uuid(),
  'user1@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"first_name": "Emily", "last_name": "Davis"}',
  '',
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create profiles for the sample users (this will be handled by the trigger, but let's ensure it)
-- Insert profiles manually to ensure they exist
INSERT INTO public.profiles (user_id, email, first_name, last_name)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'first_name',
  u.raw_user_meta_data->>'last_name'
FROM auth.users u
WHERE u.email IN ('ngo1@example.com', 'ngo2@example.com', 'vendor1@example.com', 'vendor2@example.com', 'user1@example.com')
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Assign roles to sample users
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'ngo'::app_role
FROM public.profiles p
WHERE p.email IN ('ngo1@example.com', 'ngo2@example.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'vendor'::app_role
FROM public.profiles p
WHERE p.email IN ('vendor1@example.com', 'vendor2@example.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'::app_role
FROM public.profiles p
WHERE p.email = 'user1@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create sample NGOs
INSERT INTO public.ngos (
  name,
  email,
  description,
  mission,
  location,
  category,
  phone,
  website_url,
  registration_number,
  user_id,
  is_verified,
  is_active
) VALUES 
(
  'Green Earth Foundation',
  'contact@greenearth.org',
  'Environmental conservation and sustainability organization',
  'To protect and preserve our planet for future generations',
  'San Francisco, CA',
  'Environment',
  '+1-555-0101',
  'https://greenearth.org',
  'REG-NGO-001',
  (SELECT user_id FROM public.profiles WHERE email = 'ngo1@example.com'),
  true,
  true
),
(
  'Hope for Children',
  'info@hopechildren.org',
  'Dedicated to improving children''s lives through education and healthcare',
  'Every child deserves a bright future',
  'New York, NY',
  'Education',
  '+1-555-0102',
  'https://hopechildren.org',
  'REG-NGO-002',
  (SELECT user_id FROM public.profiles WHERE email = 'ngo2@example.com'),
  true,
  true
)
ON CONFLICT DO NOTHING;

-- Create sample vendors
INSERT INTO public.vendors (
  company_name,
  contact_person,
  email,
  phone,
  address,
  description,
  services,
  user_id,
  is_active
) VALUES 
(
  'EcoSupplies Ltd',
  'David Wilson',
  'orders@ecosupplies.com',
  '+1-555-0201',
  '123 Green Street, Portland, OR',
  'Sustainable and eco-friendly supplies for organizations',
  ARRAY['Eco-friendly products', 'Sustainable packaging', 'Green office supplies'],
  (SELECT user_id FROM public.profiles WHERE email = 'vendor1@example.com'),
  true
),
(
  'TechServe Solutions',
  'Lisa Martinez',
  'support@techserve.com',
  '+1-555-0202',
  '456 Tech Avenue, Austin, TX',
  'Technology solutions and IT services for non-profits',
  ARRAY['IT consulting', 'Software development', 'Tech support'],
  (SELECT user_id FROM public.profiles WHERE email = 'vendor2@example.com'),
  true
)
ON CONFLICT DO NOTHING;

-- Create sample packages
INSERT INTO public.packages (
  title,
  description,
  amount,
  category,
  items_included,
  delivery_timeline,
  ngo_id,
  vendor_id,
  is_active
) VALUES 
(
  'Environmental Education Kit',
  'Complete educational package for environmental awareness programs',
  250.00,
  'Education',
  ARRAY['Educational materials', 'Activity guides', 'Assessment tools'],
  '5-7 business days',
  (SELECT id FROM public.ngos WHERE name = 'Green Earth Foundation'),
  (SELECT id FROM public.vendors WHERE company_name = 'EcoSupplies Ltd'),
  true
),
(
  'Children''s Learning Bundle',
  'Comprehensive learning materials for underprivileged children',
  180.00,
  'Education',
  ARRAY['Books', 'Stationery', 'Learning games', 'Activity sheets'],
  '3-5 business days',
  (SELECT id FROM public.ngos WHERE name = 'Hope for Children'),
  (SELECT id FROM public.vendors WHERE company_name = 'TechServe Solutions'),
  true
),
(
  'Basic Food Package',
  'Essential food items for families in need',
  75.00,
  'Food',
  ARRAY['Rice (5kg)', 'Cooking oil (1L)', 'Lentils (2kg)', 'Salt (1kg)'],
  '1-2 business days',
  (SELECT id FROM public.ngos WHERE name = 'Hope for Children'),
  NULL,
  true
)
ON CONFLICT DO NOTHING;