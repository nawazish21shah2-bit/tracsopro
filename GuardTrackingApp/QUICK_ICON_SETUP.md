# Quick App Icon Setup Guide

## Your TSP Shield Icon Setup

You have a beautiful shield logo with "TSP" letters and an orbiting metallic element. Here's how to set it up quickly:

## 🚀 Quick Setup (3 Methods)

### Method 1: Online Tool (Easiest - Recommended)

1. **Prepare your icon:**
   - Export your shield logo as a **1024x1024 PNG**
   - Make sure it has a solid background (no transparency for Android)

2. **Generate all sizes:**
   - Go to: https://www.appicon.co/
   - Upload your 1024x1024 icon
   - Select platforms: **iOS** and **Android**
   - Download the generated package

3. **Extract and place:**
   - **iOS:** Copy all PNG files from `ios/AppIcon.appiconset/` to:
     ```
     GuardTrackingApp/ios/GuardTrackingApp/Images.xcassets/AppIcon.appiconset/
     ```
   - **Android:** Copy icons to:
     ```
     GuardTrackingApp/android/app/src/main/res/mipmap-*/ic_launcher.png
     GuardTrackingApp/android/app/src/main/res/mipmap-*/ic_launcher_round.png
     ```

### Method 2: Using npm Package

```bash
cd GuardTrackingApp

# Install globally
npm install -g app-icon

# Generate all sizes (place your 1024x1024 icon at assets/icon/app-icon-master.png first)
app-icon generate --input assets/icon/app-icon-master.png
```

### Method 3: Manual Setup

If you prefer to do it manually, here are all the sizes you need:

#### iOS Icons (place in `ios/GuardTrackingApp/Images.xcassets/AppIcon.appiconset/`):
- `20@2x.png` - 40x40 px
- `20@3x.png` - 60x60 px  
- `29@2x.png` - 58x58 px
- `29@3x.png` - 87x87 px
- `40@2x.png` - 80x80 px
- `40@3x.png` - 120x120 px
- `60@2x.png` - 120x120 px
- `60@3x.png` - 180x180 px
- `1024.png` - 1024x1024 px (App Store)

#### Android Icons (place in `android/app/src/main/res/`):
- `mipmap-mdpi/ic_launcher.png` - 48x48 px
- `mipmap-hdpi/ic_launcher.png` - 72x72 px
- `mipmap-xhdpi/ic_launcher.png` - 96x96 px
- `mipmap-xxhdpi/ic_launcher.png` - 144x144 px
- `mipmap-xxxhdpi/ic_launcher.png` - 192x192 px

And the same sizes for `ic_launcher_round.png` in each folder.

## 📝 After Placing Icons

### Clean and Rebuild:

**Android:**
```bash
cd GuardTrackingApp/android
./gradlew clean
cd ..
npx react-native run-android
```

**iOS:**
```bash
cd GuardTrackingApp/ios
pod install
cd ..
npx react-native run-ios
```

## ✅ Verification

1. Build and run the app
2. Check the app icon appears on your device home screen
3. Verify it looks good at different sizes
4. Test on both light and dark backgrounds (if applicable)

## 🎨 Design Tips for Your TSP Shield Icon

Since your icon has:
- Shield shape with TSP letters
- Orbiting metallic element
- Blue/dark blue gradient sections

**Important considerations:**
- ✅ The "TSP" text should remain legible at 48x48 (smallest Android size)
- ✅ The shield shape should be recognizable even when small
- ✅ The orbiting element might be less visible at small sizes - that's okay
- ✅ Keep the most important elements (shield + TSP) centered
- ✅ Use a solid background color (the shield itself provides this)

## 🆘 Troubleshooting

**Icons not showing?**
- Make sure you cleaned the build: `./gradlew clean` (Android) or clean build folder in Xcode (iOS)
- Verify file names match exactly (case-sensitive)
- Check that PNG files are valid (not corrupted)

**Icons look blurry?**
- Ensure you're using the correct sizes (not just scaling one icon)
- Verify you placed icons in the correct density folders

**Need help?**
- Check `APP_ICON_SETUP.md` for detailed instructions
- Use the script: `node scripts/setup-app-icon.js` (requires ImageMagick)

