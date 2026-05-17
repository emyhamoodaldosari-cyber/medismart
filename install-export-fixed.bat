@echo off
echo ========================================
echo MediSmart - Installing Export Dependencies
echo ========================================
echo.

echo Installing jsPDF and jsPDF-AutoTable...
echo.
echo IMPORTANT: Make sure you type the package names correctly:
echo - jspdf
echo - jspdf-autotable (with hyphen, not jstotable)
echo.

npm install jspdf jspdf-autotable

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Installation Complete!
    echo ========================================
    echo.
    echo New features available:
    echo - Export reports to PDF
    echo - Export reports to CSV
    echo.
    echo Next step: npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo Installation Failed!
    echo ========================================
    echo.
    echo Please try manually:
    echo npm install jspdf jspdf-autotable
    echo.
)

echo Press any key to exit...
pause >nul
