# Build release APK pointed at laptop backend on LAN (auto-detects IP first)
$ErrorActionPreference = "Stop"

$guardAppRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $guardAppRoot
$android = Join-Path $guardAppRoot "android"
$releases = Join-Path $repoRoot "releases"

& (Join-Path $PSScriptRoot "sync-local-ip.ps1")

$env:GRADLE_USER_HOME = "D:\gradle-cache"
$env:TEMP = "D:\temp-build"
$env:TMP = "D:\temp-build"
New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME, $env:TEMP, $releases | Out-Null

Push-Location $android
try {
  .\gradlew.bat assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a
  $apk = Join-Path $android "app\build\outputs\apk\release\app-release.apk"
  $dest = Join-Path $releases "TracSOpro-local-lan-arm64.apk"
  Copy-Item $apk $dest -Force
  $ip = (Select-String -Path (Join-Path $guardAppRoot "src\config\apiConfig.ts") -Pattern "DEV_LOCAL_IP = '([^']+)'").Matches.Groups[1].Value
  Write-Host ""
  Write-Host "APK ready: $dest"
  Write-Host "Backend URL: http://${ip}:3000/api"
  Write-Host "Test on phone browser: http://${ip}:3000/api/health"
} finally {
  Pop-Location
}
