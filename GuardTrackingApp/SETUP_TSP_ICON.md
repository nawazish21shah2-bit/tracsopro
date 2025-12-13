# Setup TSP Shield App Icon - Quick Guide

## Step 1: Save Your Icon File

1. **Save your TSP shield logo image** as a PNG file
2. **Name it:** `app-icon-master.png`
3. **Place it in:** `GuardTrackingApp/assets/icon/app-icon-master.png`
4. **Requirements:**
   - Size: 1024x1024 pixels (if not, resize it first)
   - Format: PNG
   - Background: Solid (the shield itself provides the background)

## Step 2: Generate All Sizes

### Option A: Online Tool (Easiest)

1. Go to: **https://www.appicon.co/**
2. Upload your `app-icon-master.png` file
3. Select platforms: **iOS** and **Android**
4. Click "Generate"
5. Download the zip file
6. Extract it

### Option B: Alternative Online Tool

1. Go to: **https://icon.kitchen/**
2. Upload your icon
3. Select "iOS" and "Android"
4. Download and extract

## Step 3: Place iOS Icons

From the generated package, copy all PNG files from the iOS folder to:

```
GuardTrackingApp/ios/GuardTrackingApp/Images.xcassets/AppIcon.appiconset/
```

Files needed:
- `20@2x.png` (40x40)
- `20@3x.png` (60x60)
- `29@2x.png` (58x58)
- `29@3x.png` (87x87)
- `40@2x.png` (80x80)
- `40@3x.png` (120x120)
- `60@2x.png` (120x120)
- `60@3x.png` (180x180)
- `1024.png` (1024x1024)

## Step 4: Place Android Icons

From the generated package, copy icons to these folders:

```
GuardTrackingApp/android/app/src/main/res/mipmap-mdpi/ic_launcher.png (48x48)
GuardTrackingApp/android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png (48x48)

GuardTrackingApp/android/app/src/main/res/mipmap-hdpi/ic_launcher.png (72x72)
GuardTrackingApp/android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png (72x72)

GuardTrackingApp/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png (96x96)
GuardTrackingApp/android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png (96x96)

GuardTrackingApp/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png (144x144)
GuardTrackingApp/android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png (144x144)

GuardTrackingApp/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png (192x192)
GuardTrackingApp/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png (192x192)
```

## Step 5: Clean and Rebuild

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

## ✅ Verification

After rebuilding:
1. Check your device home screen - the TSP shield icon should appear
2. Verify it looks good at different sizes
3. The "TSP" text should be readable even at small sizes

## 🎨 Design Notes for TSP Shield

Your icon has:
- ✅ Shield shape (perfect for app icons)
- ✅ "TSP" letters (ensure they're centered and readable)
- ✅ Orbiting metallic element (may be less visible at small sizes - that's okay)
- ✅ Blue gradient sections (will look great as an icon)

**Tips:**
- The shield shape itself provides a good background
- The "TSP" text is the most important element - make sure it's clear
- The orbiting element adds visual interest but may fade at very small sizes

## 🆘 Need Help?

If you have the image file ready, I can help you:
1. Verify the file format and size
2. Guide you through the online tool process
3. Help troubleshoot if icons don't appear

Just let me know when you've saved the image file to `assets/icon/app-icon-master.png`!

