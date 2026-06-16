# Detect laptop WiFi/LAN IPv4 and write it into apiConfig.ts before building
$ErrorActionPreference = "Stop"

$guardAppRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $guardAppRoot "src\config\apiConfig.ts"

$ip = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notmatch '^127\.' -and
    $_.IPAddress -notmatch '^169\.254\.' -and
    $_.InterfaceAlias -notmatch 'vEthernet|VirtualBox|VMware|Loopback|WSL'
  } |
  Sort-Object -Property InterfaceMetric |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
  throw "Could not detect LAN IPv4. Run ipconfig and set DEV_LOCAL_IP manually in apiConfig.ts"
}

$content = Get-Content $configPath -Raw
$content = $content -replace "const DEV_LOCAL_IP = '[^']+';", "const DEV_LOCAL_IP = '$ip';"
Set-Content -Path $configPath -Value $content -NoNewline

Write-Host "DEV_LOCAL_IP set to $ip in apiConfig.ts"
