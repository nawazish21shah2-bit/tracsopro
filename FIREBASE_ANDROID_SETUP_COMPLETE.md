# Firebase Android Setup - Verification Guide

**Status:** ✅ `google-services.json` file added  
**Location:** `GuardTrackingApp/android/app/google-services.json`

---

## ✅ What's Done

1. **Google Services JSON file added** to the correct location
2. **Google Services plugin added** to project dependencies
3. **Plugin applied** in app-level build.gradle

---

## ⚠️ Important: Package Name Mismatch

The `google-services.json` file has package name: `com.tracsopro`  
But your app uses package name: `com.guardtrackingapp`

### You have two options:

#### Option 1: Update google-services.json (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **tracsopro-7a9f7**
3. Go to Project Settings → Your apps
4. Either:
   - Update the Android app to use package name `com.guardtrackingapp`, OR
   - Add a new Android app with package name `com.guardtrackingapp`
5. Download the new `google-services.json` file
6. Replace the existing file

#### Option 2: Change App Package Name (Not Recommended)
Change your app's package name to `com.tracsopro` in:
- `android/app/build.gradle` (applicationId)
- AndroidManifest.xml
- All Kotlin/Java files

---

## 📋 Next Steps for Complete Setup

### 1. Fix Package Name (Choose one option above)

### 2. Backend Configuration Still Needed

The `google-services.json` is for the **Android app (client-side)**.  
You still need the **Firebase Admin SDK service account key** for the **backend**.

#### Get Backend Service Account Key:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **tracsopro-7a9f7**
3. Click gear icon ⚙️ → Project Settings
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (e.g., `firebase-service-account.json`)
7. Place it in `backend/keys/` directory
8. Add to `backend/.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./keys/firebase-service-account.json
   ```

### 3. iOS Setup (If needed)

For iOS, you'll need `GoogleService-Info.plist`:
1. In Firebase Console → Project Settings → Your apps
2. Add iOS app (if not already added)
3. Download `GoogleService-Info.plist`
4. Add to `GuardTrackingApp/ios/`

---

## 🔍 Verify Setup

### Test Android Build:
```bash
cd GuardTrackingApp/android
./gradlew clean
./gradlew assembleDebug
```

### Check for Errors:
- If you see Google Services plugin errors → Plugin is working
- If you see package name mismatch → Fix package name issue
- If build succeeds → Android Firebase is configured! ✅

---

## 📱 Complete Firebase Setup Summary

| Component | Status | Location |
|-----------|--------|----------|
| **Android Client Config** | ✅ Added | `GuardTrackingApp/android/app/google-services.json` |
| **Google Services Plugin** | ✅ Configured | `build.gradle` files |
| **Package Name** | ⚠️ Needs Fix | Mismatch: `com.tracsopro` vs `com.guardtrackingapp` |
| **Backend Service Account** | ❌ Still Needed | `backend/keys/firebase-service-account.json` |
| **iOS Config** | ❌ Not Added | `GuardTrackingApp/ios/GoogleService-Info.plist` |

---

## 🎯 Quick Checklist

- [x] Add google-services.json to android/app/
- [x] Add Google Services plugin to build.gradle
- [ ] Fix package name mismatch
- [ ] Download backend service account key
- [ ] Configure backend .env file
- [ ] Test Android build
- [ ] Test push notification delivery

---

## 🚀 Once Complete

After fixing the package name and adding the backend service account:

1. **Rebuild the Android app** to include Firebase config
2. **Start backend server** with Firebase credentials
3. **Test push notifications** by creating a shift or incident
4. **Verify notifications** appear on device

---

*Setup guide created: January 2025*

