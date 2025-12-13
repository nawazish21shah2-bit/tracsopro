@echo off
REM Release Build Script for Guard Tracking App
REM This builds a production release APK that connects to your DigitalOcean backend

echo ========================================
echo Guard Tracking App - Release Build
echo ========================================
echo.

echo [1/4] Cleaning previous builds...
cd android
call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Clean failed!
    pause
    exit /b 1
)
cd ..

echo.
echo [2/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Building release APK...
cd android
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo [4/4] Build complete!
echo.
echo APK Location:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
echo To install on connected device:
echo adb install android\app\build\outputs\apk\release\app-release.apk
echo.
pause


