# Icon Fix Guide - React Native Vector Icons

## Problem
Icons are showing as placeholder boxes instead of actual icons because the font files aren't linked properly.

## Solution Applied

### 1. Configuration Files Created/Updated
- ✅ Created `react-native.config.js` to configure asset linking
- ✅ Updated `android/app/build.gradle` to include Ionicons font
- ✅ Updated `ios/GuardTrackingApp/Info.plist` to include Ionicons font

### 2. Commands to Run

#### For Android:
```bash
cd GuardTrackingApp

# Link the assets
npx react-native-asset

# Clean and rebuild
cd android
./gradlew clean
cd ..

# Run the app
npx react-native run-android
```

#### For iOS:
```bash
cd GuardTrackingApp

# Link the assets
npx react-native-asset

# Install pods
cd ios
pod install
cd ..

# Run the app
npx react-native run-ios
```

### 3. Alternative Method (If npx react-native-asset doesn't work)

#### For Android:
1. Copy the font file manually:
   ```bash
   # From GuardTrackingApp directory
   mkdir -p android/app/src/main/assets/fonts
   cp node_modules/react-native-vector-icons/Fonts/Ionicons.ttf android/app/src/main/assets/fonts/
   ```

2. Clean and rebuild:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx react-native run-android
   ```

#### For iOS:
1. The font should be automatically linked via CocoaPods
2. Just run:
   ```bash
   cd ios
   pod install
   cd ..
   npx react-native run-ios
   ```

### 4. Verify Installation

After rebuilding, the icons should display properly:
- **User icon** (person) - Blue color
- **Lock icon** (lock-closed) - Amber/Gold color
- **Mail icon** (mail) - Blue color
- **Eye icon** (eye/eye-off) - Gray color

### 5. Troubleshooting

If icons still don't show:

1. **Clear Metro bundler cache:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Completely clean the project:**
   
   **Android:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   rm -rf android/app/build
   npx react-native run-android
   ```

   **iOS:**
   ```bash
   cd ios
   rm -rf build
   pod deintegrate
   pod install
   cd ..
   npx react-native run-ios
   ```

3. **Verify font file exists:**
   ```bash
   # Check if font file exists
   ls node_modules/react-native-vector-icons/Fonts/Ionicons.ttf
   ```

## Quick Start (Recommended)

Run these commands in order:

```bash
# Navigate to app directory
cd GuardTrackingApp

# Link assets
npx react-native-asset

# For Android
cd android && ./gradlew clean && cd ..
npx react-native run-android

# OR for iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

## Files Modified
1. `react-native.config.js` - Created
2. `android/app/build.gradle` - Updated (lines 89-92)
3. `ios/GuardTrackingApp/Info.plist` - Updated (lines 53-56)

## Expected Result
After following these steps and rebuilding the app, all icons should display correctly with proper colors matching the UI design.
