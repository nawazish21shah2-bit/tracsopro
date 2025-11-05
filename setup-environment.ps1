# React Native Environment Setup Script
# Run this script as Administrator

Write-Host "Setting up React Native Environment Variables..." -ForegroundColor Green

# Set JAVA_HOME (adjust path if your JDK is installed elsewhere)
$javaHome = "C:\Program Files\Java\jdk-25"
[Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "Machine")

# Set ANDROID_HOME
$androidHome = "$env:USERPROFILE\AppData\Local\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "Machine")

# Get current PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")

# Add Android tools to PATH
$androidPaths = @(
    "$androidHome\emulator",
    "$androidHome\platform-tools", 
    "$androidHome\tools",
    "$androidHome\tools\bin"
)

$newPath = $currentPath
foreach ($path in $androidPaths) {
    if ($newPath -notlike "*$path*") {
        $newPath += ";$path"
    }
}

[Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")

Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host "Please restart your command prompt/PowerShell for changes to take effect." -ForegroundColor Yellow

# Display current environment variables
Write-Host "`nCurrent Environment Variables:" -ForegroundColor Cyan
Write-Host "JAVA_HOME: $([Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine'))"
Write-Host "ANDROID_HOME: $([Environment]::GetEnvironmentVariable('ANDROID_HOME', 'Machine'))"

