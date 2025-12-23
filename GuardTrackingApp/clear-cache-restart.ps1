Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Clearing Caches and Restarting App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Node processes (Metro bundler)
Write-Host "Step 1: Stopping Metro bundler..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clear Metro bundler cache
Write-Host "Step 2: Clearing Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path "$env:TEMP\metro-*") {
    Remove-Item -Recurse -Force "$env:TEMP\metro-*" -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\haste-map-*") {
    Remove-Item -Recurse -Force "$env:TEMP\haste-map-*" -ErrorAction SilentlyContinue
}
if (Test-Path "$env:TEMP\react-*") {
    Remove-Item -Recurse -Force "$env:TEMP\react-*" -ErrorAction SilentlyContinue
}

# Step 3: Clear watchman cache
Write-Host "Step 3: Clearing watchman cache..." -ForegroundColor Yellow
& watchman watch-del-all 2>$null

# Step 4: Clear npm cache
Write-Host "Step 4: Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Step 5: Remove Android build folders
Write-Host "Step 5: Clearing Android build cache..." -ForegroundColor Yellow
Set-Location android -ErrorAction SilentlyContinue
if ($?) {
    if (Test-Path ".cxx") {
        Remove-Item -Recurse -Force .cxx -ErrorAction SilentlyContinue
    }
    if (Test-Path "build") {
        Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
    }
    if (Test-Path "app\build") {
        Remove-Item -Recurse -Force app\build -ErrorAction SilentlyContinue
    }
    if (Test-Path "app\.cxx") {
        Remove-Item -Recurse -Force app\.cxx -ErrorAction SilentlyContinue
    }
    Set-Location ..
}

# Step 6: Clear iOS build (if exists)
Write-Host "Step 6: Clearing iOS build cache..." -ForegroundColor Yellow
if (Test-Path "ios\build") {
    Remove-Item -Recurse -Force ios\build -ErrorAction SilentlyContinue
}
if (Test-Path "ios\Pods") {
    Write-Host "  Note: Pods folder exists. Run 'cd ios && pod install' if needed." -ForegroundColor Gray
}

# Step 7: Clear React Native cache
Write-Host "Step 7: Clearing React Native cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Cache clearing complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Step 8: Start Metro bundler with cache reset
Write-Host "Step 8: Starting Metro bundler with cache reset..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting Metro bundler in new window..." -ForegroundColor Cyan
Write-Host "After Metro starts, run in a NEW terminal:" -ForegroundColor Cyan
Write-Host "  cd GuardTrackingApp" -ForegroundColor White
Write-Host "  npx react-native run-android" -ForegroundColor White
Write-Host ""

# Start Metro in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx react-native start --reset-cache"

Write-Host "Metro bundler is starting in a new window..." -ForegroundColor Green
Write-Host "Wait for Metro to finish loading, then run the Android build command." -ForegroundColor Yellow
Write-Host ""


