-- Fix for pharmacist login issue
-- The pharmacist profile has empty email which violates NOT NULL constraint
-- This SQL will fix the profile by adding a placeholder email

-- First, check if the pharmacist exists
SELECT * FROM public.profiles WHERE id = '73988718-9d48-423a-a322-3e091d4b80fc';

-- Update the pharmacist profile with a valid email
UPDATE public.profiles 
SET email = 'pharmacist@medismart.com'
WHERE id = '73988718-9d48-423a-a322-3e091d4b80fc' 
AND (email IS NULL OR email = '');

-- Also need to create a corresponding auth user if it doesn't exist
-- You'll need to create the auth user manually in Supabase Auth dashboard
-- with email: pharmacist@medismart.com and password

-- Alternative: If you want to allow empty emails temporarily, you can modify the schema:
-- ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;