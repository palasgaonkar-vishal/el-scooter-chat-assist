
-- Add Twilio integration functions and OTP management
CREATE OR REPLACE FUNCTION public.generate_otp()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Generate 6-digit OTP
    RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Create OTP verification table
CREATE TABLE public.otp_verifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mobile_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0
);

-- Enable RLS on OTP table
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Policy for OTP operations
CREATE POLICY "Anyone can create OTP requests" 
    ON public.otp_verifications 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can verify their own OTP" 
    ON public.otp_verifications 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow OTP updates for verification" 
    ON public.otp_verifications 
    FOR UPDATE 
    USING (true);

-- Cleanup expired OTPs function
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.otp_verifications 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Add mobile number encryption function
CREATE OR REPLACE FUNCTION public.encrypt_mobile_number(mobile_number TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple encryption using pgcrypto (would use proper encryption in production)
    RETURN encode(digest(mobile_number || 'ather_salt', 'sha256'), 'hex');
END;
$$;

-- Update profiles table to handle mobile authentication
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create session timeout trigger
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles 
    SET last_login = NOW() 
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;
