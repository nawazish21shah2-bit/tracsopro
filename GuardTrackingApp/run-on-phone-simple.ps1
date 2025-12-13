# Simple script to run app on phone (not emulator)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$ADB = "$env:ANDROID_HOME\platform-tools\adb.exe"

Write-Host "`nLooking for your phone...`n" -ForegroundColor Cyan

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
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "1. Make sure USB Debugging is ON in Developer Options" -ForegroundColor White
    Write-Host "2. Unplug and replug USB cable" -ForegroundColor White
    Write-Host "3. Accept 'Allow USB debugging' prompt on your phone" -ForegroundColor White
    Write-Host "4. Run this script again`n" -ForegroundColor White
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

# Run the app
npx react-native run-android --deviceId=$deviceId

