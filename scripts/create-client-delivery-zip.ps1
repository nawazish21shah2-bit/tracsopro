# Creates a client delivery zip: backend + GuardTrackingApp + docs (no secrets/build artifacts).
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyy-MM-dd"
$stagingName = "tracsopro-client-delivery"
$stagingRoot = Join-Path $env:TEMP $stagingName
$zipName = "tracsopro-client-delivery-$timestamp.zip"
$zipPath = Join-Path $repoRoot $zipName

function Invoke-Robocopy([string]$source, [string]$dest, [string[]]$excludeDirs, [string[]]$excludeFiles) {
    if (-not (Test-Path $source)) { return }
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    $args = @($source, $dest, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/nc", "/ns", "/np")
    if ($excludeDirs.Count -gt 0) { $args += "/XD"; $args += $excludeDirs }
    if ($excludeFiles.Count -gt 0) { $args += "/XF"; $args += $excludeFiles }
    & robocopy @args | Out-Null
}

Write-Host "Staging delivery package at: $stagingRoot"
if (Test-Path $stagingRoot) { Remove-Item $stagingRoot -Recurse -Force }
New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

$rootDocs = @(
    "CLIENT_HANDOFF.md",
    "ENVIRONMENT_VARIABLES.md"
)
foreach ($doc in $rootDocs) {
    $src = Join-Path $repoRoot $doc
    if (Test-Path $src) { Copy-Item $src (Join-Path $stagingRoot $doc) }
}

Invoke-Robocopy (Join-Path $repoRoot "docs") (Join-Path $stagingRoot "docs") @() @()

$backendXd = @("node_modules", "logs", "build", "dist", ".git", "coverage")
$backendXf = @(".env", ".env.*", "*.log")
Invoke-Robocopy (Join-Path $repoRoot "backend") (Join-Path $stagingRoot "backend") $backendXd $backendXf

$appXd = @(
    "node_modules", "logs", ".git", "releases", "coverage",
    "android\build", "android\.gradle", "android\.cxx", "android\.kotlin",
    "ios\build", "ios\Pods"
)
$appXf = @(".env", ".env.*", "*.log", "*.apk", "*.aab", "keystore.properties")
Invoke-Robocopy (Join-Path $repoRoot "GuardTrackingApp") (Join-Path $stagingRoot "GuardTrackingApp") $appXd $appXf

$manifest = @(
    "TracSOpro Client Delivery Package",
    "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "Contents: backend/, GuardTrackingApp/, docs/, handoff markdown files",
    "Excluded: node_modules, .env, build artifacts, logs, APKs, .git",
    "See CLIENT_HANDOFF.md for setup instructions."
)
Set-Content -Path (Join-Path $stagingRoot "PACKAGE_MANIFEST.txt") -Value $manifest -Encoding UTF8

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Write-Host "Creating zip: $zipPath"
Compress-Archive -Path (Join-Path $stagingRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal

$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "Done. Zip size: ${sizeMb} MB"
Write-Host $zipPath

Remove-Item $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue

# Write result file for verification
$resultFile = Join-Path $repoRoot "scripts\last-delivery-zip.txt"
Set-Content -Path $resultFile -Value "$zipPath|$sizeMb" -Encoding UTF8
