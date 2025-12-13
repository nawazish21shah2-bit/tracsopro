# App Icon Setup Guide

## Your App Icon
You have a shield logo with "TSP" letters and an orbiting metallic element. This guide will help you set it up for both iOS and Android.

## Step 1: Prepare Your Master Icon

1. **Create a master icon file:**
   - Size: **1024x1024 pixels**
   - Format: **PNG**
   - Background: **Solid color** (no transparency for Android)
   - Name it: `app-icon-master.png`
   - Place it in: `GuardTrackingApp/assets/icon/`

## Step 2: Generate All Required Sizes

### Option A: Using Online Tool (Easiest)
1. Go to [AppIcon.co](https://www.appicon.co/) or [IconKitchen](https://icon.kitchen/)
2. Upload your 1024x1024 icon
3. Select "React Native" or both "iOS" and "Android"
4. Download the generated icons
5. Extract and follow placement instructions below

### Option B: Using npm package (Recommended)
```bash
cd GuardTrackingApp
npm install -g app-icon
app-icon generate --input assets/icon/app-icon-master.png
```

### Option C: Manual (If you have Photoshop/GIMP)
Use the sizes listed below to manually resize your icon.

## Step 3: Place iOS Icons

Place icons in: `GuardTrackingApp/ios/GuardTrackingApp/Images.xcassets/AppIcon.appiconset/`

Required files (based on Contents.json):
- `20@2x.png` - 40x40 px
- `20@3x.png` - 60x60 px
- `29@2x.png` - 58x58 px
- `29@3x.png` - 87x87 px
- `40@2x.png` - 80x80 px
- `40@3x.png` - 120x120 px
- `60@2x.png` - 120x120 px
- `60@3x.png` - 180x180 px
- `1024.png` - 1024x1024 px (App Store)

Then update `Contents.json` to reference these files.

## Step 4: Place Android Icons

Place icons in the following folders:

### Square Icons (`ic_launcher.png`):
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` - 48x48 px
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` - 72x72 px
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` - 96x96 px
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` - 144x144 px
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` - 192x192 px

### Round Icons (`ic_launcher_round.png`):
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` - 48x48 px
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` - 72x72 px
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` - 96x96 px
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` - 144x144 px
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` - 192x192 px

## Step 5: Update iOS Contents.json

After placing icons, update the `Contents.json` file to reference them properly.

## Step 6: Clean and Rebuild

### Android:
```bash
cd GuardTrackingApp/android
./gradlew clean
cd ..
npx react-native run-android
```

### iOS:
```bash
cd GuardTrackingApp/ios
pod install
cd ..
npx react-native run-ios
```

## Quick Setup Script

I've created a helper script (`setup-app-icon.js`) that you can use. See the next section.

## Notes

- **No transparency** for Android icons (use solid background)
- **Test on devices** to ensure icons look good
- **Keep important elements centered** (corners may be clipped on some devices)
- The "TSP" text should remain legible at small sizes

