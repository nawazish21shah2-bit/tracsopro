### TracSOpro — Move / Setup Guide for a New Machine

This file documents everything needed to set up and run the TracSOpro mobile app on a new development machine (Android-focused; iOS steps included for macOS). Follow the checklist below to reproduce a working environment that matches the project.

- **Repo path for these instructions**: `GuardTrackingApp/`
- **Archive created**: `tracsopro-GuardTrackingApp.zip` (contains tracked files only)

## Quick checklist (short)
- Unzip `tracsopro-GuardTrackingApp.zip` and open the `GuardTrackingApp/` folder.
- Install prerequisites: Node >= 20, JDK 17, Android Studio + SDK, CocoaPods (macOS), Xcode (macOS if building iOS).
- Set environment variables: `JAVA_HOME`, `ANDROID_SDK_ROOT`, add `platform-tools` to `PATH`.
- Place secrets (keystore, `.env`) securely and not into zip.
- Install dependencies: `npm ci` (or `npm install`), `npx pod-install` (macOS iOS).
- Build and run: `npx react-native run-android` (Android) or open Xcode workspace and run (iOS).

## Tools & recommended versions (used by this repo)
- Node.js: >= 20 (project `engines` specifies `node: >=20`)
- npm: 9+ (or Yarn if you prefer)
- React Native: `^0.82.1` (see `GuardTrackingApp/package.json`)
- React: `19.1.1`
- React Native CLI: use `npx react-native` (local CLI packages: `@react-native-community/cli@20.0.0`)
- JDK: Temurin / OpenJDK 17 (recommended)
- Android Studio: Flamingo / Electric Eel or newer (ensure SDK manager has platform tools)
- Android SDK Platforms: install API level 31, 33 and 34 (at least one matching `compileSdk` in project)
- Android SDK Build Tools: 33.x (use Gradle wrapper in repo)
- Gradle: use repository `gradle-wrapper` (do not install globally)
- CocoaPods: `1.12+` (for iOS, macOS only)
- Xcode: 14/15+ if building iOS (macOS only)

Note: Exact minor versions of Android build tools and Gradle are controlled by the repo's Gradle wrapper and `android/build.gradle`. Prefer using the wrapper (`./gradlew`) and Android Studio sync to match the project.

## Files that must NOT be transferred inside the zip
- `node_modules/` (large; install on target machine)
- `android/**/build/`, `ios/Pods/`, `ios/build/`
- `.git/` (zip used here excludes history)
- Local secrets: `.env`, `debug.keystore`, `*.jks` — transfer these separately and securely
- IDE settings: `.vscode/`, `.idea/`, `.gradle/`

## Files you SHOULD transfer separately (securely)
- `keystore.jks` (Android signing keystore)
- Production environment `.env` (never commit secrets to repo)
- `google-services.json` and `GoogleService-Info.plist` if your CI process doesn't re-inject them

## Environment variables to set (examples)
- Windows PowerShell (example):
  - set `JAVA_HOME` and `ANDROID_SDK_ROOT` in system environment variables or profile:
    - `$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17'`
    - `$env:ANDROID_SDK_ROOT = 'C:\Users\<you>\AppData\Local\Android\Sdk'`
    - Add `C:\Users\<you>\AppData\Local\Android\Sdk\platform-tools` to `PATH`
- macOS / Linux (example - add to `~/.bashrc` or `~/.zshrc`):
  - export JAVA_HOME=$(/usr/libexec/java_home -v17)
  - export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
  - export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools

## Step-by-step setup (detailed)

1. Unzip and open project
   - Unzip `tracsopro-GuardTrackingApp.zip` to a directory on the target machine.
   - Open terminal and `cd` into the unzipped folder:
     - `cd /path/to/GuardTrackingApp`

2. Place secrets (do this BEFORE install if build scripts expect them)
   - Copy `keystore.jks` into a secure local location (example: `~/keystores/tracso/keystore.jks`) OR `android/app/` if your gradle config expects it there.
   - Copy your `.env` into the project root (do NOT put real secrets in repository). Keep an `.env.example` in repo as reference.
   - Copy Firebase files if used:
     - `android/app/google-services.json`
     - `ios/GoogleService-Info.plist`

3. Install Node modules (reproducible)
   - Recommended: use `npm ci` for consistent installs:
     - `npm ci`
   - If you prefer Yarn:
     - `yarn install`
   - Note: `postinstall` scripts for vector icons may run; ensure required tools are available.

4. Android-specific: install/update SDK components
   - Open Android Studio → SDK Manager → ensure:
     - Android SDK Tools and Platform-tools installed
     - API 31/33/34 SDK Platforms installed
     - Android SDK Build-Tools (33.x) installed

5. iOS-specific (macOS only)
   - Ensure CocoaPods installed: `sudo gem install cocoapods` or `brew install cocoapods`
   - From project root:
     - `npx pod-install` OR
     - `cd ios && pod install && cd ..`

6. Build and run (development)
   - Start Metro bundler:
     - `npx react-native start`
   - In separate terminal run:
     - Android: `npx react-native run-android`
     - iOS (macOS): `npx react-native run-ios` OR open `ios/TracSOpro.xcworkspace` in Xcode and run from there

7. Build release APK / AAB (Android)
   - Place keystore (if not already) and configure `android/gradle.properties` or `~/.gradle/gradle.properties`:
     - Example in `~/.gradle/gradle.properties`:
       ```
       TRACSO_KEYSTORE_PASSWORD=your_keystore_password
       TRACSO_KEY_ALIAS=your_key_alias
       TRACSO_KEY_PASSWORD=your_key_password
       ```
     - Or create `android/key.properties` referenced by `android/app/build.gradle`:
       ```
       storePassword=your_keystore_password
       keyAlias=your_key_alias
       keyPassword=your_key_password
       storeFile=/absolute/path/to/keystore.jks
       ```
   - Build with Gradle wrapper (recommended):
     - `cd android && ./gradlew assembleRelease` (macOS/Linux)
     - `cd android && gradlew assembleRelease` (Windows PowerShell)
   - Output APK/AAB in `android/app/build/outputs/`

8. iOS release (macOS only)
   - Open `.xcworkspace` and set signing (team, provisioning profiles) or use `xcodebuild` with exported profiles.
   - Archive and export via Xcode or `xcodebuild` commands.

## Useful diagnostic commands
- `node -v` — verify Node version (should be >=20)
- `npm -v` or `yarn -v`
- `java -version` — verify Java 17
- `adb devices` — verify device/emulator connectivity
- `npx react-native doctor` — run RN doctor for environment checks
- `git rev-parse --show-toplevel` — check project root

## Common fixes / troubleshooting
- Android build fails with SDK not found → verify `ANDROID_SDK_ROOT` and `platform-tools` in `PATH`.
- Pod install fails → ensure CocoaPods is updated and Ruby tools are installed; try `pod repo update` then `pod install`.
- Metro bundler cache issues → `npx react-native start --reset-cache`
- Vector-icons postinstall fails → make sure `node` and `npm` are available in PATH for scripts (see `postinstall` in `package.json`)
- Native modules not linking → `npx pod-install` (iOS) and clean Android build `cd android && ./gradlew clean`

## Secure transfer checklist
- Do NOT put `.env` or keystore in zip. Transfer them via secure channel (SCP, passworded S3, secure USB).
- Once transferred, set file permissions (e.g., `chmod 600 keystore.jks`) and remove copies from shared locations.

## How to use this file
- Place this file in the repository root (it was created at the repo root as `MIGRATE_APP_TO_NEW_MACHINE.md`).
- Follow the Quick checklist for a minimal, fast setup.
- Follow the detailed Step-by-step section when you need exact commands or for troubleshooting.
- If you need to reproduce the same environment repeatedly, convert parts of this guide into a shell/PowerShell script (install deps, set env vars, run `npm ci`, then `npx pod-install`) and run it on each machine.

If you want, I can also:
- Generate a PowerShell script `setup-windows.ps1` and a bash script `setup-macos-linux.sh` implementing the steps above.
- Create a small checklist file to print or tick off each step during migration.


