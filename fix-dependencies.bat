@echo off
echo ========================================
echo Fixing MediSmart Dependencies
echo ========================================
echo.

echo Step 1: Cleaning npm cache...
call npm cache clean --force
echo Done!
echo.

echo Step 2: Removing old node_modules...
if exist node_modules (
    echo Deleting node_modules folder...
    rmdir /s /q node_modules
    echo Done!
) else (
    echo No node_modules folder found.
)
echo.

echo Step 3: Removing package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
    echo Done!
) else (
    echo No package-lock.json found.
)
echo.

echo Step 4: Installing all dependencies...
call npm install
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo You can now run: npm run dev
echo.
pause
