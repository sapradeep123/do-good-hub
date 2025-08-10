-- De-duplicate by exact email and enforce uniqueness for admin UX

-- Profiles: remove duplicate emails keeping earliest created_at
WITH ranked_profiles AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) rn
  FROM profiles
)
DELETE FROM profiles p
USING ranked_profiles r
WHERE p.id = r.id AND r.rn > 1;

-- NGOs: remove duplicate emails keeping earliest
WITH ranked_ngos AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) rn
  FROM ngos
)
DELETE FROM ngos n
USING ranked_ngos r
WHERE n.id = r.id AND r.rn > 1;

-- Vendors: remove duplicate emails keeping earliest
WITH ranked_vendors AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) rn
  FROM vendors
)
DELETE FROM vendors v
USING ranked_vendors r
WHERE v.id = r.id AND r.rn > 1;

-- Enforce uniqueness on email (case-sensitive for simplicity)
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_email_unique UNIQUE (email);
ALTER TABLE ngos ADD CONSTRAINT IF NOT EXISTS ngos_email_unique UNIQUE (email);
ALTER TABLE vendors ADD CONSTRAINT IF NOT EXISTS vendors_email_unique UNIQUE (email);


