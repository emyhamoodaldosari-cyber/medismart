@echo off
echo ============================================
echo Medicines Screen Button Width Test
echo ============================================
echo.
echo Changes made to Medicines.tsx:
echo -------------------------------------------
echo 1. Changed button container from grid to flex
echo    - Before: grid grid-cols-2 gap-3
echo    - After: flex justify-center
echo.
echo 2. Changed button width from full to 50%
echo    - Before: col-span-2 (full width)
echo    - After: w-1/2 (50% width)
echo.
echo 3. Added centering for the button
echo    - Parent div: flex justify-center
echo.
echo ============================================
echo To test the changes:
echo.
echo 1. Run the application:
echo    npm run dev
echo.
echo 2. Open browser to:
echo    http://localhost:3000/medicines
echo.
echo 3. Test on different screen sizes:
echo    - Mobile (< 640px): Button should be 50% width, centered
echo    - Tablet (640px+): Button should be 50% width, centered
echo    - Desktop (1024px+): Button should be 50% width, centered
echo.
echo 4. You can also open the test file:
echo    test-button-width.html
echo    (Open in browser to see visual comparison)
echo.
echo ============================================
echo File modified:
echo src\pages\Medicines.tsx (MedicineCard component)
echo.
echo If you need different widths for different screens:
echo - Use w-full sm:w-1/2 for full width on mobile, 50% on larger
echo - Use w-1/2 md:w-1/3 for 50% on mobile, 33% on desktop
echo - Use w-auto for auto width based on content
echo.
pause