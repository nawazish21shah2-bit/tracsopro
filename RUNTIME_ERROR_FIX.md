# Fix: "Property 'StyleSheet' doesn't exist" Runtime Error

## Root Cause
This error occurs when React Native's JavaScript bundle isn't loading correctly, usually due to:
- Corrupted Metro bundler cache
- Stale build artifacts
- Module name mismatch in cached bundles

## Quick Fix (Recommended)

### Option 1: Automated Script (Windows)
```bash
cd GuardTrackingApp
.\fix-runtime-error.bat
```

Or PowerShell:
```powershell
cd GuardTrackingApp
.\fix-runtime-error.ps1
```

### Option 2: Manual Steps

#### Step 1: Stop All Running Processes
```bash
# Stop Metro bundler
taskkill /F /IM node.exe
```

#### Step 2: Clear Metro Bundler Cache
```bash
cd GuardTrackingApp
npx react-native start --reset-cache
```
Wait for Metro to start, then press `Ctrl+C` to stop it.

#### Step 3: Clear Android Build Cache
```bash
cd GuardTrackingApp/android
gradlew clean
cd ../..
```

#### Step 4: Remove Build Folders
```bash
# Remove Android build folders
rmdir /s /q GuardTrackingApp\android\build
rmdir /s /q GuardTrackingApp\android\app\build

# Remove iOS build folder (if exists)
rmdir /s /q GuardTrackingApp\ios\build
```

#### Step 5: Clear Node Modules (Optional but Recommended)
```bash
cd GuardTrackingApp
rmdir /s /q node_modules
del package-lock.json
npm install
```

#### Step 6: Rebuild the App
```bash
# Terminal 1: Start Metro with cache reset
cd GuardTrackingApp
npx react-native start --reset-cache

# Terminal 2: Build and run Android
cd GuardTrackingApp
npx react-native run-android
```

## Verification

After rebuilding, verify:
1. ✅ Metro bundler shows "Loading dependency graph..."
2. ✅ No red error screen
3. ✅ App loads to splash screen
4. ✅ No "StyleSheet doesn't exist" error

## If Issue Persists

### Check Module Name Consistency
Verify these all match "TracSOpro":
- `app.json` → `name` and `displayName`
- `MainActivity.kt` → `getMainComponentName()`
- `AppDelegate.swift` → `withModuleName`
- `index.js` → reads from `app.json`

### Nuclear Option: Complete Clean
```bash
cd GuardTrackingApp

# Remove all caches
rmdir /s /q node_modules
rmdir /s /q android\build
rmdir /s /q android\app\build
rmdir /s /q ios\build
del package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install

# Clean Android
cd android
gradlew clean
cd ..

# Rebuild
npx react-native start --reset-cache
# In new terminal:
npx react-native run-android
```

## Why This Happens

When you change the app/module name:
1. Old bundles are cached with the previous name
2. Metro bundler may serve stale bundles
3. Android/iOS may have cached JavaScript bundles
4. The runtime can't find the correctly named module

The fix ensures all caches are cleared and fresh bundles are generated with the new name "TracSOpro".


