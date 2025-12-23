# Quick Cache Clear & Restart Guide

## ✅ What Was Done

1. ✅ Stopped Metro bundler
2. ✅ Cleared npm cache
3. ✅ Cleared Android build folders (some .cxx files may be locked - that's OK)
4. ✅ Started Metro bundler in new window with `--reset-cache`

## 🚀 Next Steps

### Option 1: Use the Automated Script
```powershell
cd GuardTrackingApp
.\clear-cache-restart.ps1
```

### Option 2: Manual Steps

**Terminal 1 - Metro Bundler (Already Started)**
- A new PowerShell window should have opened with Metro bundler
- Wait for it to show: "Loading dependency graph..."
- Keep this window open

**Terminal 2 - Build Android**
```powershell
cd GuardTrackingApp
npx react-native run-android
```

## 📝 If Metro Didn't Start

Run this manually:
```powershell
cd GuardTrackingApp
npx react-native start --reset-cache
```

## ⚠️ Note About .cxx Folder

Some files in `android\app\.cxx` may show errors when deleting - this is normal. These are CMake build artifacts that will be regenerated. The important caches (npm, Metro, build folders) have been cleared.

## ✅ Verification

After restarting, you should see:
- ✅ Metro bundler running without errors
- ✅ App builds successfully
- ✅ No "expo-location" or "StyleSheet" errors
- ✅ App name shows as "TracSOpro"


