@echo off
echo ============================================
echo MediSmart Profile Issues Fix Tool
echo ============================================
echo.
echo This tool helps fix common Supabase issues:
echo 1. 406 Not Acceptable errors
echo 2. Missing user profiles
echo 3. Realtime subscription issues
echo.
echo Steps to fix:
echo.
echo 1. OPEN Supabase Dashboard
echo    - Go to: https://supabase.com/dashboard
echo    - Select your project
echo.
echo 2. RUN SQL SCRIPTS
echo    - Go to SQL Editor
echo    - Copy and run the SQL from:
echo      db\fix-406-errors.sql
echo.
echo 3. CHECK ENVIRONMENT VARIABLES
echo    - Verify .env.local has correct values:
echo      VITE_SUPABASE_URL=https://jzkzzdwhbtzfhlhoflsy.supabase.co
echo      VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
echo.
echo 4. TEST THE APPLICATION
echo    - Visit: http://localhost:5173/debug
echo    - Use the debug page to test fixes
echo.
echo 5. COMMON SOLUTIONS:
echo    - Clear browser cache and localStorage
echo    - Log out and log back in
echo    - Check browser console for errors
echo.
echo ============================================
echo Files created for debugging:
echo.
echo 1. src\utils\supabase-debug.ts
echo    - Debug utilities for 406 errors
echo.
echo 2. src\pages\Debug.tsx
echo    - Debug page at /debug route
echo.
echo 3. db\fix-406-errors.sql
echo    - SQL to fix database issues
echo.
echo 4. db\create-profile-function.sql
echo    - RPC function for profile creation
echo.
echo ============================================
echo To test the fixes:
echo 1. npm run dev
echo 2. Open browser to: http://localhost:5173
echo 3. Log in with test account
echo 4. Visit: http://localhost:5173/debug
echo 5. Click "Run Debug" button
echo.
pause