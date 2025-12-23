@echo off
echo ========================================
echo Clearing Caches and Restarting App
echo ========================================
echo.

echo Step 1: Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Metro bundler cache...
if exist "%TEMP%\metro-*" (
    for /d %%i in ("%TEMP%\metro-*") do rmdir /s /q "%%i" 2>nul
)
if exist "%TEMP%\haste-map-*" (
    for /d %%i in ("%TEMP%\haste-map-*") do rmdir /s /q "%%i" 2>nul
)
if exist "%TEMP%\react-*" (
    for /d %%i in ("%TEMP%\react-*") do rmdir /s /q "%%i" 2>nul
)

echo Step 3: Clearing watchman cache...
watchman watch-del-all 2>nul

echo Step 4: Clearing npm cache...
call npm cache clean --force

echo Step 5: Clearing Android build cache...
cd android
if exist .cxx rmdir /s /q .cxx 2>nul
if exist build rmdir /s /q build 2>nul
if exist app\build rmdir /s /q app\build 2>nul
if exist app\.cxx rmdir /s /q app\.cxx 2>nul
cd ..

echo Step 6: Clearing iOS build cache...
if exist ios\build rmdir /s /q ios\build 2>nul

echo Step 7: Clearing React Native cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul

echo.
echo ========================================
echo Cache clearing complete!
echo ========================================
echo.

echo Step 8: Starting Metro bundler...
echo.
echo Metro bundler will start in a new window.
echo After Metro loads, run in a NEW terminal:
echo   cd GuardTrackingApp
echo   npx react-native run-android
echo.

start "Metro Bundler" cmd /k "npx react-native start --reset-cache"

echo.
echo Metro bundler is starting...
echo Wait for it to finish loading, then run the Android build.
echo.
pause


