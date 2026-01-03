-- OTP Functions for SwapNest
-- Run this SQL in your Supabase SQL Editor if the functions don't exist yet

-- Function to generate and store OTP
CREATE OR REPLACE FUNCTION public.generate_otp(
  p_email TEXT,
  p_purpose TEXT DEFAULT 'signup'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_otp TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate 6-digit OTP
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  v_expires_at := now() + INTERVAL '10 minutes';
  
  -- Mark old OTPs as used
  UPDATE public.otp_verifications
  SET is_used = true
  WHERE email = p_email AND is_used = false;
  
  -- Insert new OTP
  INSERT INTO public.otp_verifications (email, otp_code, purpose, expires_at)
  VALUES (p_email, v_otp, p_purpose, v_expires_at);
  
  RETURN v_otp;
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(
  p_email TEXT,
  p_otp_code TEXT,
  p_purpose TEXT DEFAULT 'signup'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if valid OTP exists
  SELECT COUNT(*) INTO v_count
  FROM public.otp_verifications
  WHERE email = p_email
    AND otp_code = p_otp_code
    AND purpose = p_purpose
    AND is_used = false
    AND expires_at > now();
  
  IF v_count > 0 THEN
    -- Mark OTP as used
    UPDATE public.otp_verifications
    SET is_used = true
    WHERE email = p_email
      AND otp_code = p_otp_code
      AND purpose = p_purpose
      AND is_used = false;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.generate_otp(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp(TEXT, TEXT, TEXT) TO anon, authenticated;

