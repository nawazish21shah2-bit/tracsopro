# MCP Server Status Check Script
# Run this script to check if Figma MCP server is running

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Figma MCP Server Status Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if port 3845 is accessible
Write-Host "Checking MCP server on port 3845..." -ForegroundColor Yellow
$portCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 3845 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($portCheck) {
    Write-Host "✅ MCP Server is RUNNING on port 3845" -ForegroundColor Green
    Write-Host ""
    Write-Host "MCP Server URL: http://127.0.0.1:3845/mcp" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure MCP is configured in Cursor Settings" -ForegroundColor White
    Write-Host "2. Restart Cursor if you just set it up" -ForegroundColor White
} else {
    Write-Host "❌ MCP Server is NOT RUNNING" -ForegroundColor Red
    Write-Host ""
    Write-Host "To set up MCP server:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Open Figma Desktop App (not browser)" -ForegroundColor White
    Write-Host "2. Press Shift + D to enable Dev Mode" -ForegroundColor White
    Write-Host "3. In the right panel, click 'Enable desktop MCP server'" -ForegroundColor White
    Write-Host "4. You should see: 'MCP server running at http://127.0.0.1:3845/mcp'" -ForegroundColor White
    Write-Host ""
    Write-Host "5. In Cursor:" -ForegroundColor White
    Write-Host "   - Open Settings (Ctrl + ,)" -ForegroundColor White
    Write-Host "   - Go to MCP tab" -ForegroundColor White
    Write-Host "   - Add server:" -ForegroundColor White
    Write-Host "     Name: figma-desktop" -ForegroundColor Gray
    Write-Host "     URL: http://127.0.0.1:3845/mcp" -ForegroundColor Gray
    Write-Host "   - Save and restart Cursor" -ForegroundColor White
    Write-Host ""
    Write-Host "See docs/MCP-SETUP-NOW.md for detailed instructions" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan










