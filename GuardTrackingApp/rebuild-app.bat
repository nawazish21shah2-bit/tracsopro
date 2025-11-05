@echo off
echo ========================================
echo Rebuilding React Native App with Icons
echo ========================================

echo.
echo Step 1: Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul

echo.
echo Step 2: Clearing Metro cache...
call npx react-native start --reset-cache &
timeout /t 3
taskkill /F /IM node.exe 2>nul

echo.
echo Step 3: Starting Metro bundler...
start "Metro Bundler" cmd /k "npx react-native start"

echo.
echo Step 4: Waiting for Metro to start...
timeout /t 5

echo.
echo Step 5: Running Android app...
call npx react-native run-android

echo.
echo ========================================
echo Build Complete!
echo Icons should now display correctly.
echo ========================================
pause
