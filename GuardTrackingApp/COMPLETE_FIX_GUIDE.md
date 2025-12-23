# Complete Fix Guide - StyleSheet Error (2 Days Issue)

## 🔴 The Problem
"Property 'StyleSheet' doesn't exist" - React Native core isn't loading. This happens when:
- Bundle isn't loading correctly
- Module name mismatch
- Corrupted caches
- Node modules corruption

## ✅ Solution: Nuclear Reset

### Step 1: Run Nuclear Reset Script
```powershell
cd GuardTrackingApp
.\NUCLEAR_RESET.ps1
```

This will:
- ✅ Delete node_modules
- ✅ Clear all caches (npm, Metro, watchman)
- ✅ Remove all build artifacts
- ✅ Reinstall everything fresh
- ✅ Clean Android project

### Step 2: Verify Module Names Match

Check these files all have **"TracSOpro"**:
- ✅ `app.json` → `"name": "TracSOpro"`
- ✅ `MainActivity.kt` → `"TracSOpro"`
- ✅ `AppDelegate.swift` → `"TracSOpro"`
- ✅ `index.js` → reads from `app.json`

### Step 3: Start Fresh

**Terminal 1 - Metro:**
```powershell
cd GuardTrackingApp
npx react-native start --reset-cache
```

Wait for: `Loading dependency graph...`

**Terminal 2 - Build:**
```powershell
cd GuardTrackingApp
npx react-native run-android
```

## 🔧 Alternative: Manual Nuclear Reset

If script doesn't work, do this manually:

```powershell
cd GuardTrackingApp

# Stop everything
Get-Process -Name node,java -ErrorAction SilentlyContinue | Stop-Process -Force

# Delete everything
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\app\.cxx -ErrorAction SilentlyContinue

# Clear caches
npm cache clean --force
watchman watch-del-all 2>$null

# Reinstall
npm install

# Clean Android
cd android
.\gradlew clean
cd ..

# Start Metro
npx react-native start --reset-cache
```

## 🎯 If Still Not Working

### Check 1: Module Name Case Sensitivity
React Native might be case-sensitive. Try changing to lowercase:

1. Edit `app.json`:
```json
{
  "name": "tracsopro",
  "displayName": "TracSOpro"
}
```

2. Update `MainActivity.kt`:
```kotlin
override fun getMainComponentName(): String = "tracsopro"
```

3. Update `AppDelegate.swift`:
```swift
withModuleName: "tracsopro",
```

4. Rebuild everything

### Check 2: Verify React Native Installation
```powershell
npx react-native doctor
```

### Check 3: Check for Syntax Errors
```powershell
npx tsc --noEmit
```

### Check 4: Try Different Metro Port
```powershell
npx react-native start --reset-cache --port 8082
```

Then update `android/app/src/main/java/.../MainActivity.kt` to use port 8082, or set in `metro.config.js`

## 📝 Why This Happens

After code cleanup and name changes:
1. Old bundles cached with wrong module name
2. Metro bundler serving stale bundles
3. Node modules corrupted
4. Build artifacts mismatch

The nuclear reset fixes all of these by starting completely fresh.

## ✅ Success Indicators

After reset, you should see:
- ✅ Metro shows "Loading dependency graph..."
- ✅ No red error screen
- ✅ App loads to splash screen
- ✅ No "StyleSheet" or module errors
- ✅ App name shows "TracSOpro"

## 🆘 Last Resort

If nothing works, the issue might be in the code itself. Check:
1. `App.tsx` - Make sure it imports React Native correctly
2. `index.js` - Verify app registration
3. Any recent code changes that might have broken imports

Try creating a minimal test:
```javascript
// index.js - Minimal test
import { AppRegistry } from 'react-native';
import { View, Text, StyleSheet } from 'react-native';

const TestApp = () => (
  <View style={styles.container}>
    <Text>Test</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

AppRegistry.registerComponent('TracSOpro', () => TestApp);
```

If this works, the issue is in your App.tsx or imports.


