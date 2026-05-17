@echo off
echo ============================================
echo Testing pt-32 Padding Change
echo ============================================
echo.
echo Current pt-32 definition in src/index.css:
echo -------------------------------------------
findstr "pt-32" "src\index.css"
echo.
echo.
echo To test the change:
echo 1. Run: npm run dev
echo 2. Open browser to: http://localhost:3000
echo 3. Inspect any element with class "pt-32"
echo 4. Check computed padding-top value
echo.
echo Expected result:
echo - Original: padding-top: calc(var(--spacing) * 32) = 128px
echo - New: padding-top: calc(var(--spacing) * 5) = 20px
echo.
echo You can also open test-pt-32.html in browser to see
echo a visual comparison of the padding change.
echo.
echo ============================================
echo If the change doesn't work:
echo 1. Clear browser cache
echo 2. Restart the dev server
echo 3. Check if there are conflicting styles
echo.
pause