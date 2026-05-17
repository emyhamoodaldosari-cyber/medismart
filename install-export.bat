@echo off
echo ========================================
echo MediSmart - Installing Export Dependencies
echo ========================================
echo.

echo Installing jsPDF and jsPDF-AutoTable...
echo.

npm install jspdf jspdf-autotable

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo New features available:
echo - Export reports to PDF
echo - Export reports to CSV
echo.
echo Press any key to exit...
pause >nul
