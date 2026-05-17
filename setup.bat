@echo off
echo ========================================
echo MediSmart Setup Script
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [2/3] Checking environment configuration...
if not exist .env.local (
    echo WARNING: .env.local file not found!
    echo Please configure your environment variables in .env.local
    echo.
    echo You need:
    echo - VITE_SUPABASE_URL
    echo - VITE_SUPABASE_ANON_KEY
    echo - GEMINI_API_KEY
    echo.
    pause
)
echo.

echo [3/3] Setup complete!
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Then open http://localhost:3000 in your browser
echo.
pause
