-- ===================================================================
-- PHARMACIST LOGIN ISSUE DIAGNOSIS AND FIX
-- ===================================================================

-- Step 1: Check if auth user exists with the pharmacist email
-- Run this in Supabase SQL Editor to see if auth.users record exists

SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  au.last_sign_in_at,
  pp.id as profile_id,
  pp.email as profile_email,
  pp.role as profile_role,
  pp.full_name,
  pp.pharmacy_id
FROM auth.users au
LEFT JOIN public.profiles pp ON pp.id = au.id
WHERE au.email = 'pharmacist@medismart.io'
   OR pp.email = 'pharmacist@medismart.io';

-- ===================================================================
-- IF NO AUTH USER EXISTS, YOU NEED TO CREATE ONE
-- ===================================================================

-- Option A: Create auth user via Admin API (from Supabase Dashboard)
-- 1. Go to Authentication -> Users
-- 2. Click "Add User"
-- 3. Enter: email = pharmacist@medismart.io
-- 4. Enter: password = (create a secure password)
-- 5. Click "Create User"

-- Option B: If you want to link existing profile to new auth user
-- First create the auth user (Option A), then:

-- Verify the profile ID matches the auth user ID after creation
-- If they don't match, you'll need to update the profile ID to match auth user

-- ===================================================================
-- CHECK ALL USERS (both auth.users and public.profiles)
-- ===================================================================

-- View all auth users
SELECT id, email, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC LIMIT 20;

-- View all profiles
SELECT id, email, role, full_name, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 20;

-- Find profiles without matching auth users
SELECT 
  pp.id as profile_id,
  pp.email as profile_email,
  pp.role,
  pp.full_name
FROM public.profiles pp
LEFT JOIN auth.users au ON au.id = pp.id
WHERE au.id IS NULL;

-- ===================================================================
-- QUICK FIX: If profile exists but auth doesn't match
-- Update profile ID to match auth user (if different)
-- ===================================================================

-- Run this AFTER creating the auth user to link them:
-- UPDATE public.profiles 
-- SET id = 'auth-user-id-here'
-- WHERE email = 'pharmacist@medismart.io';

-- ===================================================================
-- TEST LOGIN
-- ===================================================================

-- After creating the auth user, test login with:
-- Email: pharmacist@medismart.io
-- Password: [the password you set]