# Fix App Registration Error

## Problem
Error: "GuardTrackingApp" has not been registered

## Solution Steps

### 1. Stop Metro Bundler
- Press `Ctrl+C` in the terminal where Metro is running
- Or close the terminal window

### 2. Clear All Caches

#### Clear Metro Bundler Cache
```bash
cd GuardTrackingApp
npx react-native start --reset-cache
```

#### Clear Android Build Cache
```bash
cd GuardTrackingApp/android
./gradlew clean
cd ..
```

#### Clear Node Modules (if needed)
```bash
cd GuardTrackingApp
rm -rf node_modules
npm install
# or
yarn install
```

### 3. Clear Watchman (if installed)
```bash
watchman watch-del-all
```

### 4. Rebuild the App

#### For Android
```bash
cd GuardTrackingApp
npx react-native run-android
```

#### For iOS
```bash
cd GuardTrackingApp
cd ios
pod install
cd ..
npx react-native run-ios
```

### 5. If Still Not Working

Check that `app.json` has the correct name:
```json
{
  "name": "TracSOpro",
  "displayName": "TracSOpro"
}
```

Verify `index.js` is registering correctly:
```javascript
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

### 6. Nuclear Option (Complete Clean)
```bash
cd GuardTrackingApp

# Clear all caches
rm -rf node_modules
rm -rf android/app/build
rm -rf android/build
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
watchman watch-del-all
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*

# Reinstall
npm install
cd ios && pod install && cd ..

# Rebuild
npx react-native run-android
```


