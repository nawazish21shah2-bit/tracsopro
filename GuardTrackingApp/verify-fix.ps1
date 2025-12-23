Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying Fix - StyleSheet Error" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Verify module names match
Write-Host "Check 1: Verifying module names..." -ForegroundColor Yellow
$appJson = Get-Content "app.json" | ConvertFrom-Json
$mainActivity = Get-Content "android\app\src\main\java\com\tracsopro\MainActivity.kt" | Select-String "getMainComponentName"
$appDelegate = Get-Content "ios\GuardTrackingApp\AppDelegate.swift" | Select-String "withModuleName"

Write-Host "  app.json name: $($appJson.name)" -ForegroundColor $(if ($appJson.name -eq "tracsopro") { "Green" } else { "Red" })
Write-Host "  MainActivity: $($mainActivity -replace '.*"([^"]+)".*', '$1')" -ForegroundColor $(if ($mainActivity -match '"tracsopro"') { "Green" } else { "Red" })
Write-Host "  AppDelegate: $($appDelegate -replace '.*"([^"]+)".*', '$1')" -ForegroundColor $(if ($appDelegate -match '"tracsopro"') { "Green" } else { "Red" })

if ($appJson.name -eq "tracsopro" -and $mainActivity -match '"tracsopro"' -and $appDelegate -match '"tracsopro"') {
    Write-Host "  ✓ All module names match (tracsopro)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Module names don't match!" -ForegroundColor Red
}

Write-Host ""

# Check 2: Verify StyleSheet imports
Write-Host "Check 2: Checking StyleSheet imports..." -ForegroundColor Yellow
$filesWithStyleSheet = Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "StyleSheet\.(create|flatten)" | Select-Object -ExpandProperty Path -Unique
$missingImports = @()

foreach ($file in $filesWithStyleSheet) {
    $content = Get-Content $file -Raw
    if ($content -notmatch "import.*StyleSheet.*from.*react-native") {
        $missingImports += $file
    }
}

if ($missingImports.Count -eq 0) {
    Write-Host "  ✓ All StyleSheet usages have imports" -ForegroundColor Green
} else {
    Write-Host "  ✗ Missing StyleSheet imports in:" -ForegroundColor Red
    $missingImports | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
}

Write-Host ""

# Check 3: Verify React Native installation
Write-Host "Check 3: Checking React Native installation..." -ForegroundColor Yellow
if (Test-Path "node_modules\react-native") {
    $rnVersion = (Get-Content "node_modules\react-native\package.json" | ConvertFrom-Json).version
    Write-Host "  ✓ React Native installed: v$rnVersion" -ForegroundColor Green
} else {
    Write-Host "  ✗ React Native not found in node_modules!" -ForegroundColor Red
}

Write-Host ""

# Check 4: Verify entry point
Write-Host "Check 4: Verifying entry point..." -ForegroundColor Yellow
$indexJs = Get-Content "index.js" -Raw
if ($indexJs -match "AppRegistry" -and $indexJs -match "react-native") {
    Write-Host "  ✓ index.js correctly imports AppRegistry" -ForegroundColor Green
} else {
    Write-Host "  ✗ index.js missing AppRegistry import!" -ForegroundColor Red
}

if ($indexJs -match "app\.json") {
    Write-Host "  ✓ index.js reads from app.json" -ForegroundColor Green
} else {
    Write-Host "  ✗ index.js not reading from app.json!" -ForegroundColor Red
}

Write-Host ""

# Check 5: Verify App.tsx exports
Write-Host "Check 5: Verifying App.tsx..." -ForegroundColor Yellow
$appTsx = Get-Content "App.tsx" -Raw
if ($appTsx -match "export default") {
    Write-Host "  ✓ App.tsx has default export" -ForegroundColor Green
} else {
    Write-Host "  ✗ App.tsx missing default export!" -ForegroundColor Red
}

if ($appTsx -match "import.*react-native") {
    Write-Host "  ✓ App.tsx imports from react-native" -ForegroundColor Green
} else {
    Write-Host "  ✗ App.tsx missing react-native import!" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all checks pass, the issue is likely:" -ForegroundColor Yellow
Write-Host "  1. Metro bundler cache (run with --reset-cache)" -ForegroundColor White
Write-Host "  2. Android build cache (run gradlew clean)" -ForegroundColor White
Write-Host "  3. Need to rebuild after module name change" -ForegroundColor White
Write-Host ""


