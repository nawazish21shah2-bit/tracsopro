Write-Host "========================================" -ForegroundColor Red
Write-Host "NUCLEAR RESET - Complete Clean Rebuild" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This will DELETE and REBUILD everything!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel, or any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Step 1: Stopping all processes..." -ForegroundColor Cyan
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "Step 2: Removing node_modules..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed node_modules" -ForegroundColor Green
}

Write-Host "Step 3: Removing package-lock.json..." -ForegroundColor Cyan
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed package-lock.json" -ForegroundColor Green
}

Write-Host "Step 4: Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force
Write-Host "  ✓ Cleared npm cache" -ForegroundColor Green

Write-Host "Step 5: Removing Android build artifacts..." -ForegroundColor Cyan
$androidPaths = @(
    "android\build",
    "android\app\build",
    "android\app\.cxx",
    "android\.gradle"
)
foreach ($path in $androidPaths) {
    if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "  ✓ Removed $path" -ForegroundColor Green
    }
}

Write-Host "Step 6: Removing iOS build artifacts..." -ForegroundColor Cyan
if (Test-Path "ios\build") {
    Remove-Item -Recurse -Force ios\build -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed ios\build" -ForegroundColor Green
}
if (Test-Path "ios\Pods") {
    Remove-Item -Recurse -Force ios\Pods -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed ios\Pods" -ForegroundColor Green
}

Write-Host "Step 7: Clearing Metro bundler cache..." -ForegroundColor Cyan
$tempPaths = @(
    "$env:TEMP\metro-*",
    "$env:TEMP\haste-map-*",
    "$env:TEMP\react-*"
)
foreach ($pattern in $tempPaths) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "  ✓ Cleared Metro cache" -ForegroundColor Green

Write-Host "Step 8: Clearing watchman cache..." -ForegroundColor Cyan
& watchman watch-del-all 2>$null
Write-Host "  ✓ Cleared watchman cache" -ForegroundColor Green

Write-Host "Step 9: Reinstalling dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Installation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Step 10: Cleaning Android project..." -ForegroundColor Cyan
Set-Location android
& .\gradlew clean --no-daemon 2>&1 | Out-Null
Set-Location ..
Write-Host "  ✓ Android cleaned" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "NUCLEAR RESET COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start Metro: npx react-native start --reset-cache" -ForegroundColor White
Write-Host "2. In new terminal: npx react-native run-android" -ForegroundColor White
Write-Host ""


