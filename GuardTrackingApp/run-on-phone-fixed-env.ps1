# Fix Android SDK path conflict and run on phone
# This script sets both ANDROID_HOME and ANDROID_SDK_ROOT to the same value

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME  # Fix the conflict

$ADB = "$env:ANDROID_HOME\platform-tools\adb.exe"

Write-Host "`n=== Android SDK Path Fix ===" -ForegroundColor Cyan
Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host "ANDROID_SDK_ROOT: $env:ANDROID_SDK_ROOT" -ForegroundColor Green
Write-Host "`nChecking for your phone...`n" -ForegroundColor Cyan

# Restart ADB
& $ADB kill-server
Start-Sleep -Seconds 1
& $ADB start-server
Start-Sleep -Seconds 2

# Get all devices
$allDevices = & $ADB devices
Write-Host $allDevices

# Find phone (not emulator)
$phoneDevice = ($allDevices | Select-String "device$" | Where-Object { $_ -notmatch "emulator" }).Line

if (-not $phoneDevice) {
    Write-Host "`n❌ No phone detected!" -ForegroundColor Red
    Write-Host "Please connect your phone and accept USB debugging prompt.`n" -ForegroundColor Yellow
    exit
}

# Close emulator if running
$emulatorDevices = ($allDevices | Select-String "emulator.*device$").Line
if ($emulatorDevices) {
    Write-Host "`nClosing emulator..." -ForegroundColor Yellow
    foreach ($emu in $emulatorDevices) {
        $emuId = ($emu -split "\s+")[0]
        & $ADB -s $emuId emu kill
    }
    Start-Sleep -Seconds 2
}

# Get phone device ID
$deviceId = ($phoneDevice -split "\s+")[0]
Write-Host "`n✅ Found your phone: $deviceId" -ForegroundColor Green
Write-Host "Building and installing app...`n" -ForegroundColor Cyan

# Change to project directory
Set-Location $PSScriptRoot

# Setup port forwarding
& $ADB -s $deviceId reverse tcp:8081 tcp:8081

# Run the app with fixed environment variables
Write-Host "Starting build with fixed SDK paths...`n" -ForegroundColor Cyan
npx react-native run-android --device=$deviceId

