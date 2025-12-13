# PowerShell script to find and kill process on port 3000

Write-Host "🔍 Finding process on port 3000..." -ForegroundColor Cyan

# Find process using port 3000
$process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($process) {
    $processInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
    if ($processInfo) {
        Write-Host "✅ Found process: $($processInfo.ProcessName) (PID: $process)" -ForegroundColor Yellow
        Write-Host "   Command: $($processInfo.Path)" -ForegroundColor Gray
        
        $response = Read-Host "Do you want to kill this process? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            Stop-Process -Id $process -Force
            Write-Host "✅ Process killed. You can now start the backend server." -ForegroundColor Green
        } else {
            Write-Host "⚠️  Process not killed. Use a different port or stop it manually." -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Process found but cannot get details (may have already stopped)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ No process found on port 3000" -ForegroundColor Green
    Write-Host "   The port should be available now." -ForegroundColor Green
}



