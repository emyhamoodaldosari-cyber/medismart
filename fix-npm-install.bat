@echo off
echo Fixing npm installation issues...
echo.

echo Step 1: Clearing npm cache...
call npm cache clean --force
echo.

echo Step 2: Verifying npm cache...
call npm cache verify
echo.

echo Step 3: Installing jspdf and jspdf-autotable...
call npm install jspdf@2.5.2 jspdf-autotable@3.8.4
echo.

echo Installation complete!
pause
