# Manual Build Instructions

## ✅ Build Processes Stopped

All Java/Gradle processes have been stopped. You can now build manually.

## 🔨 Manual Build Steps

### Option 1: Using Build Script
```bash
cd C:\learnings\tracsopro
.\build-android-apk.bat
```

### Option 2: Using Gradle Directly
```bash
cd GuardTrackingApp\android
.\gradlew.bat clean
.\gradlew.bat assembleRelease --no-daemon
```

## 📱 APK Location

After build completes:
```
GuardTrackingApp\android\app\build\outputs\apk\release\app-release.apk
```

## ⚠️ Important Notes

- **Release APK** includes JavaScript bundle (works standalone)
- **Debug APK** needs Metro bundler (for development only)
- Use **release APK** for testing on device

## 🧹 If You Need to Clean First

```bash
cd GuardTrackingApp\android
Remove-Item -Recurse -Force "app\.cxx" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
.\gradlew.bat clean
```

---

**All processes stopped. You can now build manually using the commands above!**


