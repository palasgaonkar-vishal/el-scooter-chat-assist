-- Update the handle_new_user function to extract mobile_number from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, mobile_number)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        CASE 
            WHEN NEW.email LIKE '%@atherenergy.com' THEN 'admin'::user_role
            ELSE 'customer'::user_role
        END,
        -- Extract mobile number from user metadata or email
        COALESCE(
            NEW.raw_user_meta_data->>'mobile_number',
            CASE 
                WHEN NEW.email LIKE '%@mobile.customer.ather.local' THEN
                    '+' || SPLIT_PART(NEW.email, '@', 1)
                ELSE NULL
            END
        )
    );
    RETURN NEW;
END;
$function$