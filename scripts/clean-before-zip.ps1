# Remove heavy folders before manual zip (Windows PowerShell)
# Run from repo root: powershell -ExecutionPolicy Bypass -File scripts/clean-before-zip.ps1

$ErrorActionPreference = "SilentlyContinue"
$repoRoot = Split-Path -Parent $PSScriptRoot

$pathsToRemove = @(
    "node_modules",
    "backend\node_modules",
    "GuardTrackingApp\node_modules",
    "backend\logs",
    "backend\dist",
    "backend\build",
    "backend\coverage",
    "GuardTrackingApp\coverage",
    "GuardTrackingApp\releases",
    "releases",
    "GuardTrackingApp\android\.gradle",
    "GuardTrackingApp\android\.kotlin",
    "GuardTrackingApp\android\build",
    "GuardTrackingApp\android\app\.cxx",
    "GuardTrackingApp\android\app\build",
    "GuardTrackingApp\ios\build",
    "GuardTrackingApp\ios\Pods",
    "GuardTrackingApp\android\GuardTrackingApp\node_modules",
    ".cursor"
)

Write-Host "Cleaning heavy folders under: $repoRoot"
foreach ($rel in $pathsToRemove) {
    $full = Join-Path $repoRoot $rel
    if (Test-Path $full) {
        Write-Host "  Removing $rel"
        Remove-Item $full -Recurse -Force
    }
}

# Remove log files anywhere (shallow)
Get-ChildItem -Path $repoRoot -Recurse -Include "*.log" -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
    ForEach-Object {
        Write-Host "  Removing log: $($_.FullName.Substring($repoRoot.Length))"
        Remove-Item $_.FullName -Force
    }

Write-Host ""
Write-Host "Done. Safe to zip manually. Exclude any remaining .env files and keystore.properties."
Write-Host "After unzip, run: npm install in backend/ and GuardTrackingApp/"
