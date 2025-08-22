-- Clear all sample data from Do Good Hub database
-- Run this in your PostgreSQL database

BEGIN;

-- Clear in correct order to respect foreign key constraints

-- 1. Clear transactions first
DELETE FROM transactions;

-- 2. Clear donations
DELETE FROM donations;

-- 3. Clear orders
DELETE FROM orders;

-- 4. Clear vendor package assignments
DELETE FROM vendor_package_assignments;

-- 5. Clear package assignments
DELETE FROM package_assignments;

-- 6. Clear packages
DELETE FROM packages;

-- 7. Clear vendors
DELETE FROM vendors;

-- 8. Clear NGOs
DELETE FROM ngos;

-- 9. Clear password reset requests
DELETE FROM password_reset_requests;

-- 10. Clear admin audit logs
DELETE FROM admin_audit_log;

-- 11. Clear tickets and page content
DELETE FROM tickets;
DELETE FROM page_content;

-- 12. Clear non-admin user profiles (keep admin users)
DELETE FROM profiles 
WHERE role != 'admin' 
AND email NOT IN ('admin@example.com', 'admin@test.com', 'admin@dogoodhub.com');

-- Reset sequences if they exist
DO $$
BEGIN
    -- Reset sequences for auto-incrementing IDs
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'profiles_id_seq') THEN
        ALTER SEQUENCE profiles_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'ngos_id_seq') THEN
        ALTER SEQUENCE ngos_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'vendors_id_seq') THEN
        ALTER SEQUENCE vendors_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'packages_id_seq') THEN
        ALTER SEQUENCE packages_id_seq RESTART WITH 1;
    END IF;
END $$;

COMMIT;

-- Verify cleanup
SELECT 
    'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'ngos', COUNT(*) FROM ngos
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'packages', COUNT(*) FROM packages
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'donations', COUNT(*) FROM donations
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;
