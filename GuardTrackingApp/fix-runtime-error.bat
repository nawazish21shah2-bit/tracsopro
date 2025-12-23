@echo off
echo ========================================
echo Fixing React Native Runtime Error
echo ========================================
echo.

echo Step 1: Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Metro bundler cache...
call npx react-native start --reset-cache --port 8081 &
timeout /t 3 /nobreak >nul
taskkill /F /IM node.exe 2>nul

echo Step 3: Clearing watchman cache (if installed)...
watchman watch-del-all 2>nul

echo Step 4: Clearing npm cache...
call npm cache clean --force

echo Step 5: Removing node_modules and reinstalling...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    del package-lock.json
)

echo Installing dependencies...
call npm install

echo Step 6: Clearing Android build cache...
cd android
if exist build (
    echo Removing Android build folder...
    rmdir /s /q build
)
if exist app\build (
    echo Removing Android app build folder...
    rmdir /s /q app\build
)
call gradlew clean
cd ..

echo Step 7: Clearing iOS build cache (if on Mac)...
if exist ios\build (
    echo Removing iOS build folder...
    rmdir /s /q ios\build
)

echo.
echo ========================================
echo Cache clearing complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start Metro bundler: npx react-native start --reset-cache
echo 2. In a new terminal, run: npx react-native run-android
echo.
pause


