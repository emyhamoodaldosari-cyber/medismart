@echo off
echo ========================================
echo MediSmart - Firebase Deployment
echo ========================================
echo.

echo [1/4] Checking Firebase CLI...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Firebase CLI not found. Installing...
    call npm install -g firebase-tools
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Firebase CLI
        pause
        exit /b 1
    )
)
echo ✓ Firebase CLI ready
echo.

echo [2/4] Building production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✓ Build successful
echo.

echo [3/4] Checking Firebase login...
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Firebase...
    call firebase login
)
echo ✓ Firebase authenticated
echo.

echo [4/4] Deploying to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)
echo.

echo ========================================
echo ✅ Deployment Successful!
echo ========================================
echo.
echo Your app is now live!
echo Check Firebase Console for the URL
echo.
pause
