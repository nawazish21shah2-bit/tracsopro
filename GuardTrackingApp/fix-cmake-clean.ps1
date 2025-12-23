Write-Host "Fixing CMake Clean Error..." -ForegroundColor Yellow

# Remove .cxx folder which causes CMake errors during clean
$cxxPath = "android\app\.cxx"
if (Test-Path $cxxPath) {
    Write-Host "Removing .cxx folder..." -ForegroundColor Gray
    Remove-Item -Recurse -Force $cxxPath
    Write-Host "✓ Removed .cxx folder" -ForegroundColor Green
} else {
    Write-Host "✓ .cxx folder doesn't exist" -ForegroundColor Green
}

# Remove build folders
$buildPaths = @(
    "android\build",
    "android\app\build"
)

foreach ($path in $buildPaths) {
    if (Test-Path $path) {
        Write-Host "Removing $path..." -ForegroundColor Gray
        Remove-Item -Recurse -Force $path
        Write-Host "✓ Removed $path" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Now you can run: .\gradlew clean" -ForegroundColor Cyan


