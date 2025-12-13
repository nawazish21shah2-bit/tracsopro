# Fix NDK Compatibility Issue

## Problem
The build is failing due to C++20 compatibility issues between React Native 0.82.1 and NDK 25.2.9519653.

## Solution: Install Compatible NDK Version

### Option 1: Install via Android Studio (Recommended)
1. Open Android Studio
2. Go to **Tools > SDK Manager**
3. Click on **SDK Tools** tab
4. Check **Show Package Details** at the bottom right
5. Expand **NDK (Side by side)**
6. Check **24.0.8215888** (or **26.1.10909125**)
7. Click **Apply** to install

### Option 2: Install via Command Line
```powershell
# Find your SDK manager
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$sdkManager = Get-ChildItem -Path $sdkPath -Recurse -Filter "sdkmanager.bat" | Select-Object -First 1

# Install NDK 24.0.8215888
& $sdkManager.FullName "ndk;24.0.8215888"
```

### Option 3: Update build.gradle
After installing NDK 24.0.8215888, the build.gradle is already configured to use it.

## After Installation
1. Restart your terminal/IDE
2. Clean the build: `cd android && .\gradlew clean`
3. Try building again: `npm run android`

## Current Configuration
The `android/build.gradle` file is set to use NDK 26.1.10909125. If that version is not installed, change it to:
```gradle
ndkVersion = "24.0.8215888"
```


