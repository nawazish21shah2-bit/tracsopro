# Script to run React Native app on physical Android device
# This script will detect your phone and run the app on it

$ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$ADB = "$ANDROID_HOME\platform-tools\adb.exe"

Write-Host "Checking for connected devices..." -ForegroundColor Cyan

# Restart ADB server to refresh device list
& $ADB kill-server
Start-Sleep -Seconds 1
& $ADB start-server
Start-Sleep -Seconds 1

# List devices
$devices = & $ADB devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }

if ($devices.Count -eq 0) {
    Write-Host "`n❌ No devices found!" -ForegroundColor Red
    
    # Check for USB devices that might need drivers
    Write-Host "`n=== Checking USB Connections ===" -ForegroundColor Cyan
    $usbDevices = Get-PnpDevice | Where-Object {$_.FriendlyName -like "*ADB*" -or $_.FriendlyName -like "*Android*"}
    if ($usbDevices.Count -gt 0) {
        Write-Host "⚠️  Found USB devices but drivers may be missing:" -ForegroundColor Yellow
        $usbDevices | Format-Table FriendlyName, Status, InstanceId -AutoSize
        Write-Host "`n🔧 Driver Fix Steps:" -ForegroundColor Yellow
        Write-Host "1. Open Device Manager (Win+X → Device Manager)" -ForegroundColor White
        Write-Host "2. Look for 'Android Phone' or 'Unknown Device' under 'Other devices'" -ForegroundColor White
        Write-Host "3. Right-click → Update driver → Browse my computer" -ForegroundColor White
        Write-Host "4. Point to: $ANDROID_HOME\extras\google\usb_driver" -ForegroundColor White
        Write-Host "   OR install your phone manufacturer's USB drivers" -ForegroundColor White
    }
    
    Write-Host "`n📱 Phone Setup Checklist:" -ForegroundColor Yellow
    Write-Host "1. Enable Developer Options:" -ForegroundColor White
    Write-Host "   - Go to Settings → About Phone" -ForegroundColor Gray
    Write-Host "   - Tap 'Build Number' 7 times" -ForegroundColor Gray
    Write-Host "2. Enable USB Debugging:" -ForegroundColor White
    Write-Host "   - Settings → Developer Options → USB Debugging (ON)" -ForegroundColor Gray
    Write-Host "3. Connect via USB and accept prompt:" -ForegroundColor White
    Write-Host "   - When you see 'Allow USB debugging?' → Tap 'Allow'" -ForegroundColor Gray
    Write-Host "   - Check 'Always allow from this computer'" -ForegroundColor Gray
    Write-Host "4. Try different USB cable/port" -ForegroundColor White
    Write-Host "5. On some phones, change USB mode to 'File Transfer' or 'MTP'" -ForegroundColor White
    
    Write-Host "`n🔄 Trying to refresh device list..." -ForegroundColor Cyan
    & $ADB kill-server
    Start-Sleep -Seconds 2
    & $ADB start-server
    Start-Sleep -Seconds 2
    $devices = & $ADB devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }
    
    if ($devices.Count -eq 0) {
        Write-Host "`nStill no devices found. Please fix drivers/connection and try again.`n" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ Device detected after refresh!" -ForegroundColor Green
    }
}

# Filter out emulators (emulator devices typically have 'emulator-' prefix)
$physicalDevices = $devices | Where-Object { $_ -notmatch "emulator-" }

if ($physicalDevices.Count -eq 0) {
    Write-Host "`n⚠️  Only emulator(s) found. Closing emulator..." -ForegroundColor Yellow
    $emulatorDevices = $devices | Where-Object { $_ -match "emulator-" }
    foreach ($emu in $emulatorDevices) {
        $deviceId = ($emu -split "\s+")[0]
        Write-Host "Closing emulator: $deviceId" -ForegroundColor Yellow
        & $ADB -s $deviceId emu kill
    }
    Start-Sleep -Seconds 2
    
    # Check again for physical devices
    $devices = & $ADB devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }
    $physicalDevices = $devices | Where-Object { $_ -notmatch "emulator-" }
}

if ($physicalDevices.Count -eq 0) {
    Write-Host "`n❌ No physical device found after closing emulator!" -ForegroundColor Red
    Write-Host "Please connect your phone and try again.`n" -ForegroundColor Yellow
    exit 1
}

# Get the first physical device ID
$deviceId = ($physicalDevices[0] -split "\s+")[0]
Write-Host "`n✅ Found device: $deviceId" -ForegroundColor Green
Write-Host "Running app on your phone...`n" -ForegroundColor Cyan

# Change to project directory
Set-Location $PSScriptRoot

# Start Metro bundler in background if not already running
$metroRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" }
if (-not $metroRunning) {
    Write-Host "Starting Metro bundler..." -ForegroundColor Cyan
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start" -WorkingDirectory $PSScriptRoot
    Start-Sleep -Seconds 5
}

# Run the app on the specific device
Write-Host "Building and installing app on device: $deviceId" -ForegroundColor Cyan
& $ADB -s $deviceId reverse tcp:8081 tcp:8081
npx react-native run-android --deviceId=$deviceId

