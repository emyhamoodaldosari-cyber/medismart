@echo off
echo ========================================
echo MediSmart - Yarn Installation (Alternative)
echo ========================================
echo.

echo Checking if Yarn is installed...
call yarn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Yarn is not installed. Installing Yarn globally...
    call npm install -g yarn
    echo.
)

echo Step 1: Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo Done!
)
echo.

echo Step 2: Removing lock files...
if exist package-lock.json del /f package-lock.json
if exist yarn.lock del /f yarn.lock
echo.

echo Step 3: Installing with Yarn...
call yarn install
echo.

if %errorlevel% equ 0 (
    echo ========================================
    echo SUCCESS! Installation completed with Yarn.
    echo ========================================
    echo.
    echo You can now run: yarn dev
    echo (or use: npm run dev)
) else (
    echo Installation failed with Yarn too.
    echo Please check your internet connection.
)

echo.
pause
