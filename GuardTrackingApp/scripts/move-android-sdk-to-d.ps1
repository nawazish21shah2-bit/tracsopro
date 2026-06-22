# Moves Android SDK from C: to D:\Android\Sdk and updates env + project config.
# Run from an elevated or normal PowerShell: .\scripts\move-android-sdk-to-d.ps1

$ErrorActionPreference = 'Stop'

$oldSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$newSdk = 'D:\Android\Sdk'
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$localProperties = Join-Path $repoRoot 'GuardTrackingApp\android\local.properties'

Write-Host "Old SDK: $oldSdk"
Write-Host "New SDK: $newSdk"

if (-not (Test-Path $oldSdk)) {
    if (Test-Path $newSdk) {
        Write-Host "SDK already at $newSdk"
    } else {
        throw "No Android SDK found at $oldSdk"
    }
} elseif (-not (Test-Path $newSdk)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $newSdk -Parent) | Out-Null
    Write-Host "Moving SDK (~17 GB). This may take several minutes..."
    & robocopy $oldSdk $newSdk /E /MOVE /R:2 /W:5 /NFL /NDL /NP | Out-Null
    $robocopyCode = $LASTEXITCODE
    if ($robocopyCode -ge 8) {
        throw "robocopy failed with exit code $robocopyCode"
    }
    Write-Host "SDK moved to $newSdk"
} else {
    Write-Host "Destination already exists; skipping file move."
}

# Junction so tools still using AppData path keep working
$oldParent = Split-Path $oldSdk -Parent
if (-not (Test-Path $oldSdk) -and (Test-Path $newSdk)) {
    if (-not (Test-Path $oldParent)) {
        New-Item -ItemType Directory -Force -Path $oldParent | Out-Null
    }
    cmd /c "mklink /J `"$oldSdk`" `"$newSdk`"" | Out-Null
    Write-Host "Created junction: $oldSdk -> $newSdk"
}

# User environment variables
[Environment]::SetEnvironmentVariable('ANDROID_HOME', $newSdk, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $newSdk, 'User')
[Environment]::SetEnvironmentVariable('GRADLE_USER_HOME', 'D:\gradle-cache', 'User')

$env:ANDROID_HOME = $newSdk
$env:ANDROID_SDK_ROOT = $newSdk
$env:GRADLE_USER_HOME = 'D:\gradle-cache'

# Update PATH: replace old Android paths with new ones
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$segments = $userPath -split ';' | Where-Object { $_ -and ($_ -notmatch '\\Android\\Sdk\\') }
$newSegments = @(
    "$newSdk\platform-tools",
    "$newSdk\emulator",
    "$newSdk\cmdline-tools\latest\bin"
)
$updatedPath = ($newSegments + $segments) -join ';'
[Environment]::SetEnvironmentVariable('Path', $updatedPath, 'User')
$env:Path = $updatedPath + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')

# Project local.properties (forward slashes for Gradle)
$sdkDirLine = "sdk.dir=$($newSdk -replace '\\', '/')"
if (Test-Path $localProperties) {
    $content = Get-Content $localProperties -Raw
    if ($content -match 'sdk\.dir=') {
        $content = $content -replace 'sdk\.dir=.*', $sdkDirLine
    } else {
        $content = "$sdkDirLine`n$content"
    }
} else {
    $content = "$sdkDirLine`n"
}
Set-Content -Path $localProperties -Value $content.TrimEnd() -NoNewline
Add-Content -Path $localProperties -Value "`n"

Write-Host "Updated $localProperties"
Write-Host "ANDROID_HOME=$newSdk"
Write-Host "GRADLE_USER_HOME=D:\gradle-cache"

if (Test-Path "$newSdk\platform-tools\adb.exe") {
    & "$newSdk\platform-tools\adb.exe" version
}

Write-Host "Done. Restart terminals and Android Studio to pick up new env vars."
