-- PHARMACIST LOGIN FIX - DATABASE VERIFICATION
-- Run this in Supabase SQL Editor to verify setup is correct

-- ============================================================================
-- TEST 1: Verify Pharmacist Auth User Exists
-- ============================================================================
-- This should return 1 row if pharmacist@medismart.io is registered in auth.users

SELECT 
  id,
  email,
  confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN confirmed_at IS NOT NULL THEN 'CONFIRMED'
    ELSE 'PENDING CONFIRMATION'
  END as status
FROM auth.users
WHERE email = 'pharmacist@medismart.io';

-- Expected result:
-- One row with:
--   - confirmed_at: NOT NULL (must be confirmed to login)
--   - status: CONFIRMED

-- ============================================================================
-- TEST 2: Verify Pharmacist Profile Exists
-- ============================================================================
-- This should return 1 row with role='pharmacist'

SELECT 
  id,
  email,
  role,
  full_name,
  pharmacy_id,
  is_active,
  created_at,
  updated_at
FROM public.profiles
WHERE email = 'pharmacist@medismart.io';

-- Expected result:
-- One row with:
--   - role: 'pharmacist' (NOT 'customer' or NULL)
--   - is_active: true
--   - pharmacy_id: NOT NULL (linked to a pharmacy)

-- ============================================================================
-- TEST 3: Verify Auth User ↔ Profile ID Match
-- ============================================================================
-- The IDs in auth.users and public.profiles must match for this user

SELECT 
  a.id as auth_user_id,
  a.email,
  p.id as profile_id,
  p.role,
  p.email as profile_email,
  CASE 
    WHEN a.id = p.id THEN '✓ IDs MATCH'
    ELSE '✗ IDS DO NOT MATCH (BUG!)'
  END as match_status
FROM auth.users a
FULL OUTER JOIN public.profiles p ON a.id = p.id
WHERE a.email = 'pharmacist@medismart.io' OR p.email = 'pharmacist@medismart.io';

-- Expected result:
-- One row with:
--   - match_status: '✓ IDs MATCH'
--   - If this fails, the profile is linked to wrong user ID

-- ============================================================================
-- TEST 4: Verify Pharmacy Link
-- ============================================================================
-- If pharmacy_id is set, verify the pharmacy exists

SELECT 
  p.id,
  p.email,
  p.role,
  p.pharmacy_id,
  ph.name as pharmacy_name,
  ph.is_active as pharmacy_active
FROM public.profiles p
LEFT JOIN public.pharmacies ph ON p.pharmacy_id = ph.id
WHERE p.email = 'pharmacist@medismart.io';

-- Expected result:
-- One row with:
--   - pharmacy_id: NOT NULL
--   - pharmacy_name: NOT NULL (pharmacy exists)
--   - pharmacy_active: true

-- ============================================================================
-- TEST 5: Verify RLS Policies Allow Profile Read
-- ============================================================================
-- Test if RLS policies allow authenticated users to read their own profile

-- First, verify the RLS policy exists for profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected result:
-- Multiple rows showing RLS policies for profiles table

-- ============================================================================
-- TEST 6: Count Users by Role
-- ============================================================================
-- Quick overview of all users and their roles

SELECT 
  role,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM public.profiles
GROUP BY role
ORDER BY role;

-- Expected result:
-- Rows like:
--   admin     | 1 | 1
--   customer  | N | M
--   pharmacist| 1 | 1

-- ============================================================================
-- TEST 7: Check Auth Session TTL
-- ============================================================================
-- Verify session expires correctly (important for security)

SELECT 
  configuration,
  value
FROM pg_settings
WHERE name LIKE 'interval%' OR name LIKE '%timeout%';

-- This varies by Supabase configuration

-- ============================================================================
-- IF TESTS FAIL - Run These Fixes
-- ============================================================================

-- FIX 1: If pharmacist profile doesn't exist or has wrong role
-- Replace UUID with actual pharmacist user ID from auth.users
UPDATE public.profiles
SET 
  role = 'pharmacist',
  pharmacy_id = (SELECT id FROM public.pharmacies WHERE is_active = true LIMIT 1),
  is_active = true,
  updated_at = now()
WHERE email = 'pharmacist@medismart.io';

-- FIX 2: If pharmacist profile is missing entirely, create it
-- First get the user ID:
-- SELECT id FROM auth.users WHERE email = 'pharmacist@medismart.io';
-- Then insert:

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  pharmacy_id,
  is_active,
  preferred_language
)
VALUES (
  '<USER_ID_FROM_AUTH_USERS>',
  'pharmacist@medismart.io',
  'Pharmacist User',
  'pharmacist',
  (SELECT id FROM public.pharmacies WHERE is_active = true LIMIT 1),
  true,
  'en'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'pharmacist',
  is_active = true,
  updated_at = now();

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================
-- After running fixes, re-run TEST 1-7 above to verify:
-- ✓ TEST 1: Auth user exists and is confirmed
-- ✓ TEST 2: Profile exists with role='pharmacist'
-- ✓ TEST 3: Auth ID matches Profile ID
-- ✓ TEST 4: Pharmacy is linked correctly
-- ✓ TEST 5: RLS policies are configured
-- ✓ TEST 6: Role distribution looks correct
-- ✓ TEST 7: Session configuration is appropriate
