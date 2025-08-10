-- First, let's clean up the current NGO assignments to make them more realistic
-- We'll keep ngo1@example.com assigned to Green Earth Foundation only
-- And create new users for other NGOs

-- Update Akshaya Patra Foundation to not have a user assigned (we'll assign a new user via the sample data function)
UPDATE public.ngos 
SET user_id = NULL 
WHERE id = '23471d26-04c0-4334-ac75-a5482b69bbcb';

-- Update Green Earth Foundation to keep the current user
-- (This one already has the correct assignment)