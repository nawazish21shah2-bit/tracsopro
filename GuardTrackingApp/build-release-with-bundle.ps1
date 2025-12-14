# Build Release APK with JavaScript Bundle
# This script ensures the JavaScript bundle is included in the release build

Write-Host "🚀 Building Release APK with Bundle..." -ForegroundColor Green

# Navigate to app directory
Set-Location $PSScriptRoot

# Step 1: Create assets directory if it doesn't exist
Write-Host "📁 Creating assets directory..." -ForegroundColor Yellow
$assetsDir = "android/app/src/main/assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null
    Write-Host "✅ Created assets directory" -ForegroundColor Green
} else {
    Write-Host "✅ Assets directory exists" -ForegroundColor Green
}

# Step 2: Generate JavaScript bundle
Write-Host "📦 Generating JavaScript bundle..." -ForegroundColor Yellow
npx react-native bundle `
    --platform android `
    --dev false `
    --entry-file index.js `
    --bundle-output android/app/src/main/assets/index.android.bundle `
    --assets-dest android/app/src/main/res/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Bundle generation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Bundle generated successfully" -ForegroundColor Green

# Step 3: Build release APK
Write-Host "🔨 Building release APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Set-Location ..

# Step 4: Show APK location
$apkPath = "android/app/build/outputs/apk/release/app-release.apk"
if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host ""
    Write-Host "✅ Release APK built successfully!" -ForegroundColor Green
    Write-Host "📍 Location: $apkPath" -ForegroundColor Cyan
    Write-Host "📦 Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To install on device:" -ForegroundColor Yellow
    Write-Host "  adb install -r $apkPath" -ForegroundColor White
} else {
    Write-Host "⚠️  APK not found at expected location" -ForegroundColor Yellow
}

