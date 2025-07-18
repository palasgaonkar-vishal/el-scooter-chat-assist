
-- Create the missing user_role enum type
CREATE TYPE public.user_role AS ENUM ('customer', 'admin');

-- Create the missing scooter_model enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE public.scooter_model AS ENUM ('450S', '450X', 'Rizta');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the missing faq_category enum type (if not exists) 
DO $$ BEGIN
    CREATE TYPE public.faq_category AS ENUM ('charging', 'service', 'range', 'orders', 'cost', 'license', 'warranty');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the missing order_status enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the missing escalation_priority enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE public.escalation_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the missing escalation_status enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE public.escalation_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the handle_new_user function to work properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, mobile_number)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        CASE 
            WHEN NEW.email LIKE '%@atherenergy.com' THEN 'admin'::user_role
            WHEN NEW.raw_user_meta_data->>'mobile_number' IS NOT NULL THEN 'customer'::user_role
            ELSE 'customer'::user_role
        END,
        NEW.raw_user_meta_data->>'mobile_number'
    );
    RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DO $$ BEGIN
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create an admin user for testing (replace with your actual email)
-- You'll need to manually set the password in Supabase Auth UI after running this
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@atherenergy.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin User"}',
    false,
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;
