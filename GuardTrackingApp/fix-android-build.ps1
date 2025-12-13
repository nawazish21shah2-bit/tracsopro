# Fix Android Build - Codegen Issue
# This script fixes the react-native-vector-icons codegen error

Write-Host "Fixing Android Build Codegen Issue..." -ForegroundColor Cyan

# Navigate to GuardTrackingApp directory
Set-Location $PSScriptRoot

# Step 1: Clean everything
Write-Host "`nStep 1: Cleaning build artifacts..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "Clean failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Clean additional directories
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue app\.cxx
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue app\build
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue build
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .gradle

Set-Location ..

# Step 2: Clean node_modules codegen directories
Write-Host "`nStep 2: Cleaning node_modules codegen..." -ForegroundColor Yellow
$codegenPath = "node_modules\react-native-vector-icons\android\build"
if (Test-Path $codegenPath) {
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $codegenPath
    Write-Host "Cleaned react-native-vector-icons build directory" -ForegroundColor Green
}

# Step 3: Create missing codegen directory structure
Write-Host "`nStep 3: Creating missing codegen directory..." -ForegroundColor Yellow
$missingDir = "node_modules\react-native-vector-icons\android\build\generated\source\codegen\jni"
New-Item -ItemType Directory -Force -Path $missingDir | Out-Null
Write-Host "Created missing codegen directory" -ForegroundColor Green

# Step 4: Generate codegen by building debug first
Write-Host "`nStep 4: Building debug to generate codegen..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleDebug --no-daemon
if ($LASTEXITCODE -ne 0) {
    Write-Host "Debug build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Step 5: Build release
Write-Host "`nStep 5: Building release APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleRelease --no-daemon
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild successful!" -ForegroundColor Green
    Write-Host "`nAPK location: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Cyan
} else {
    Write-Host "`nRelease build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host "`nDone!" -ForegroundColor Green

