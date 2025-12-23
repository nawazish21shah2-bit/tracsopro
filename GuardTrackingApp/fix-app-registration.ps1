# Fix App Registration Error - Windows PowerShell Script
# This script clears all caches and rebuilds the app

Write-Host "🔧 Fixing App Registration Error..." -ForegroundColor Cyan
Write-Host ""

# Navigate to app directory
Set-Location $PSScriptRoot

# Step 1: Stop any running Metro bundler
Write-Host "1. Stopping Metro bundler..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clear Metro cache
Write-Host "2. Clearing Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\react-*") {
    Remove-Item "$env:TEMP\react-*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 3: Clear Android build cache
Write-Host "3. Clearing Android build cache..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item "android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "android\build") {
    Remove-Item "android\build" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 4: Clear iOS build cache (if on Mac or have iOS)
Write-Host "4. Clearing iOS build cache..." -ForegroundColor Yellow
if (Test-Path "ios\build") {
    Remove-Item "ios\build" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "ios\Pods") {
    Remove-Item "ios\Pods" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 5: Verify app.json
Write-Host "5. Verifying app.json..." -ForegroundColor Yellow
$appJson = Get-Content "app.json" | ConvertFrom-Json
if ($appJson.name -ne "TracSOpro") {
    Write-Host "❌ ERROR: app.json name is not 'TracSOpro'" -ForegroundColor Red
    Write-Host "   Current name: $($appJson.name)" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ app.json is correct: $($appJson.name)" -ForegroundColor Green

# Step 6: Verify index.js
Write-Host "6. Verifying index.js..." -ForegroundColor Yellow
$indexJs = Get-Content "index.js" -Raw
if ($indexJs -notmatch "AppRegistry\.registerComponent") {
    Write-Host "❌ ERROR: index.js is missing AppRegistry.registerComponent" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ index.js is correct" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Cache clearing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npx react-native start --reset-cache" -ForegroundColor White
Write-Host "2. In another terminal, run: npx react-native run-android" -ForegroundColor White
Write-Host ""


