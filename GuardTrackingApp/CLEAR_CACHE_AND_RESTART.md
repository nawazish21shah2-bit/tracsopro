# Clear Cache and Restart - TracSOpro

## ✅ App Name Updated to "TracSOpro"

All files have been updated:
- ✅ `app.json` - name: "TracSOpro"
- ✅ `index.js` - uses appName from app.json
- ✅ `MainActivity.kt` - getMainComponentName() returns "TracSOpro"
- ✅ `strings.xml` - app_name: "TracSOpro"
- ✅ `settings.gradle` - rootProject.name = 'TracSOpro'

## 🔄 To Fix the Registration Error:

### Option 1: Clear Metro Cache (Recommended)
```bash
cd GuardTrackingApp
npx react-native start --reset-cache
```

### Option 2: Full Clean and Rebuild
```bash
cd GuardTrackingApp

# Clear Metro cache
npx react-native start --reset-cache

# In another terminal, clean Android build
cd android
./gradlew clean
cd ..

# Rebuild and run
npx react-native run-android
```

### Option 3: Complete Clean (If above doesn't work)
```bash
cd GuardTrackingApp

# Stop Metro bundler (Ctrl+C)

# Clear all caches
rm -rf node_modules
npm install

# Clear Metro cache
npx react-native start --reset-cache

# Clean Android
cd android
./gradlew clean
cd ..

# Rebuild
npx react-native run-android
```

## 📱 After Clearing Cache:

1. **Stop Metro bundler** if running (Ctrl+C)
2. **Start with reset cache**: `npx react-native start --reset-cache`
3. **In another terminal**, rebuild the app: `npx react-native run-android`

The app should now register as "TracSOpro" instead of "GuardTrackingApp".

