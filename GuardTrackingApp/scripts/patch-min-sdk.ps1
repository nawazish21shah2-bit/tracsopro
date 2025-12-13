# Script to patch React Native native modules for minSdkVersion 24
# This fixes the React Native 0.82.1 bug where CMake detects minSdkVersion 22

Write-Host "Patching native modules for minSdkVersion 24..." -ForegroundColor Cyan

$screensBuildGradle = "node_modules\react-native-screens\android\build.gradle"
$workletsBuildGradle = "node_modules\react-native-worklets\android\build.gradle"

# Patch react-native-screens
if (Test-Path $screensBuildGradle) {
    $content = Get-Content $screensBuildGradle -Raw
    if ($content -notmatch "minSdkVersion 24  // Force 24") {
        $content = $content -replace "minSdkVersion safeExtGet\(\[.minSdkVersion., .minSdk.\], rnsDefaultMinSdkVersion\)", "minSdkVersion 24  // Force 24 to fix React Native 0.82.1 CMake bug"
        $content = $content -replace 'arguments "-DANDROID_STL=c\+\+_shared",\s+"-DRNS_NEW_ARCH_ENABLED=\$\{IS_NEW_ARCHITECTURE_ENABLED\}",\s+"-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON"', 'arguments "-DANDROID_STL=c++_shared", "-DRNS_NEW_ARCH_ENABLED=${IS_NEW_ARCHITECTURE_ENABLED}", "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON", "-DANDROID_PLATFORM=android-24"'
        Set-Content $screensBuildGradle -Value $content -NoNewline
        Write-Host "✓ Patched react-native-screens" -ForegroundColor Green
    } else {
        Write-Host "✓ react-native-screens already patched" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ react-native-screens not found" -ForegroundColor Red
}

# Patch react-native-worklets
if (Test-Path $workletsBuildGradle) {
    $content = Get-Content $workletsBuildGradle -Raw
    if ($content -notmatch "minSdkVersion 24  // Force 24") {
        $content = $content -replace 'minSdkVersion safeExtGet\("minSdkVersion", 23\)', 'minSdkVersion 24  // Force 24 to fix React Native 0.82.1 CMake bug'
        $content = $content -replace '"-DWORKLETS_FEATURE_FLAGS=\$\{WORKLETS_FEATURE_FLAGS\}"', '"-DWORKLETS_FEATURE_FLAGS=${WORKLETS_FEATURE_FLAGS}", "-DANDROID_PLATFORM=android-24"'
        Set-Content $workletsBuildGradle -Value $content -NoNewline
        Write-Host "✓ Patched react-native-worklets" -ForegroundColor Green
    } else {
        Write-Host "✓ react-native-worklets already patched" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ react-native-worklets not found" -ForegroundColor Red
}

Write-Host "`nPatching complete! Clean and rebuild:" -ForegroundColor Cyan
Write-Host "  cd android && .\gradlew.bat clean && cd .. && npm run android" -ForegroundColor Yellow

