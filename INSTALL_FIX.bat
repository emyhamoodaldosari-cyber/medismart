@echo off
echo ========================================
echo MediSmart - Complete Installation Fix
echo ========================================
echo.

echo Step 1: Clearing npm cache forcefully...
call npm cache clean --force
if %errorlevel% neq 0 (
    echo WARNING: Cache clean had issues, continuing anyway...
)
echo.

echo Step 2: Verifying npm cache integrity...
call npm cache verify
echo.

echo Step 3: Removing node_modules folder...
if exist node_modules (
    echo Deleting node_modules...
    rmdir /s /q node_modules
    echo Done!
) else (
    echo No node_modules folder found.
)
echo.

echo Step 4: Removing package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
    echo Done!
) else (
    echo No package-lock.json found.
)
echo.

echo Step 5: Installing all dependencies...
echo This may take 2-3 minutes...
call npm install --legacy-peer-deps
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo SUCCESS! Installation completed.
    echo ========================================
    echo.
    echo You can now run: npm run dev
) else (
    echo ========================================
    echo Installation failed. Trying alternative...
    echo ========================================
    echo.
    echo Attempting with --force flag...
    call npm install --force
)

echo.
pause
