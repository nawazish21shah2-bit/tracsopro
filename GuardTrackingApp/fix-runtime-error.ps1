Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing React Native Runtime Error" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Stopping Metro bundler..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Step 2: Clearing Metro bundler cache..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "react-native", "start", "--reset-cache", "--port", "8081" -PassThru | Out-Null
Start-Sleep -Seconds 3
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Step 3: Clearing watchman cache (if installed)..." -ForegroundColor Yellow
& watchman watch-del-all 2>$null

Write-Host "Step 4: Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Step 5: Removing node_modules and reinstalling..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

Write-Host "Installing dependencies..." -ForegroundColor Gray
npm install

Write-Host "Step 6: Clearing Android build cache..." -ForegroundColor Yellow
Set-Location android
if (Test-Path "build") {
    Write-Host "Removing Android build folder..." -ForegroundColor Gray
    Remove-Item -Recurse -Force build
}
if (Test-Path "app\build") {
    Write-Host "Removing Android app build folder..." -ForegroundColor Gray
    Remove-Item -Recurse -Force app\build
}
& .\gradlew clean
Set-Location ..

Write-Host "Step 7: Clearing iOS build cache..." -ForegroundColor Yellow
if (Test-Path "ios\build") {
    Write-Host "Removing iOS build folder..." -ForegroundColor Gray
    Remove-Item -Recurse -Force ios\build
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Cache clearing complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start Metro bundler: npx react-native start --reset-cache" -ForegroundColor White
Write-Host "2. In a new terminal, run: npx react-native run-android" -ForegroundColor White
Write-Host ""


