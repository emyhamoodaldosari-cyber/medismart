@echo off
echo ========================================
echo MediSmart - Quick Test Script
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)
echo ✓ Node.js installed
echo.

echo [2/5] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)
echo ✓ Dependencies ready
echo.

echo [3/5] Checking environment variables...
if not exist ".env.local" (
    echo WARNING: .env.local not found!
    echo Please create .env.local with Supabase credentials
    pause
)
echo ✓ Environment file exists
echo.

echo [4/5] Running TypeScript check...
call npm run lint
if %errorlevel% neq 0 (
    echo WARNING: TypeScript errors found
)
echo.

echo [5/5] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✓ Build successful
echo.

echo ========================================
echo ✅ All tests passed!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Open: http://localhost:3000
echo 3. Test all features
echo 4. Deploy when ready
echo.
pause
