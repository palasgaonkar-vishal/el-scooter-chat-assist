-- Manually confirm the existing admin user's email
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email = 'admin@atherenergy.com' AND email_confirmed_at IS NULL;