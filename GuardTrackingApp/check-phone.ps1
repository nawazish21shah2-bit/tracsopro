# Simple script to check if phone is connected
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$ADB = "$env:ANDROID_HOME\platform-tools\adb.exe"

Write-Host "`nChecking for your phone...`n" -ForegroundColor Cyan

& $ADB kill-server
Start-Sleep -Seconds 1
& $ADB start-server
Start-Sleep -Seconds 2

$devices = & $ADB devices

Write-Host $devices

$phoneFound = $devices -match "device$" -and $devices -notmatch "emulator"

if ($phoneFound) {
    Write-Host "`n✅ Phone detected! You can now run: npm run android" -ForegroundColor Green
} else {
    Write-Host "`n❌ Phone not detected yet." -ForegroundColor Red
    Write-Host "`nMake sure:" -ForegroundColor Yellow
    Write-Host "1. USB Debugging is ON in Developer Options" -ForegroundColor White
    Write-Host "2. You accepted the 'Allow USB debugging' prompt on your phone" -ForegroundColor White
    Write-Host "3. USB mode is set to 'File Transfer'`n" -ForegroundColor White
}

