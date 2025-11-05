# React Native Development Environment Setup Guide

## Prerequisites
- Windows 10/11
- Administrator privileges
- Internet connection

## Step 1: Install Java Development Kit (JDK 17)

### Download and Install JDK 17:
1. Go to [Adoptium (Eclipse Temurin)](https://adoptium.net/temurin/releases/?version=17)
2. Download "Windows x64 MSI" installer
3. Run the installer as Administrator
4. Follow the installation wizard (default settings are fine)

### Verify Installation:
```cmd
java -version
javac -version
```

## Step 2: Install Android Studio

### Download and Install Android Studio:
1. Go to [Android Studio Download](https://developer.android.com/studio)
2. Download the Windows installer
3. Run as Administrator
4. During installation, ensure these components are selected:
   - ✅ Android SDK
   - ✅ Android SDK Platform
   - ✅ Android Virtual Device
   - ✅ Performance (Intel HAXM) - if Intel processor

## Step 3: Configure Android SDK

### Open Android Studio and Configure SDK:
1. Launch Android Studio
2. Go to **Configure** → **SDK Manager**

### SDK Platforms Tab:
- Check "Show Package Details"
- Install:
  - ✅ Android 15 (API Level 35)
  - ✅ Android SDK Platform 35
  - ✅ Intel x86 Atom_64 System Image (or Google APIs Intel x86 Atom System Image)

### SDK Tools Tab:
- Check "Show Package Details"
- Install:
  - ✅ Android SDK Build-Tools 35.0.0
  - ✅ Android Emulator
  - ✅ Android SDK Platform-Tools

## Step 4: Set Environment Variables

### Option A: Use the provided scripts (Run as Administrator)
```cmd
# Run the batch script
setup-environment.bat

# OR run the PowerShell script
PowerShell -ExecutionPolicy Bypass -File setup-environment.ps1
```

### Option B: Manual Setup
1. Open System Properties → Advanced → Environment Variables
2. Add these System Variables:
   - `JAVA_HOME`: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
   - `ANDROID_HOME`: `C:\Users\%USERNAME%\AppData\Local\Android\Sdk`
3. Add to PATH:
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

## Step 5: Create Android Virtual Device (AVD)

1. Open Android Studio
2. Go to **Configure** → **AVD Manager**
3. Click **"Create Virtual Device"**
4. Choose a device (e.g., Pixel 7)
5. Select system image (API Level 35)
6. Configure AVD settings and click **"Finish"**
7. Start the emulator to test

## Step 6: Verify Setup

### Test React Native Doctor:
```cmd
cd GuardTrackingApp
npx react-native doctor
```

### Test the App:
```cmd
# Start Metro bundler
npx react-native start

# In another terminal, run Android
npx react-native run-android
```

## Troubleshooting

### Common Issues:
1. **"java not recognized"**: Restart terminal after setting JAVA_HOME
2. **"adb not found"**: Check ANDROID_HOME and PATH variables
3. **Emulator won't start**: Enable virtualization in BIOS
4. **Build fails**: Check Android SDK installation

### Useful Commands:
```cmd
# Check environment variables
echo %JAVA_HOME%
echo %ANDROID_HOME%

# List Android devices
adb devices

# Check React Native setup
npx react-native doctor
```

## Next Steps
After completing this setup:
1. Restart your terminal/command prompt
2. Navigate to your React Native project
3. Run `npx react-native doctor` to verify everything
4. Start developing your Guard Tracking App!

## Support
- [React Native Documentation](https://reactnative.dev/docs/environment-setup)
- [Android Studio Documentation](https://developer.android.com/studio/intro)

