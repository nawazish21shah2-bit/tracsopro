# Production Setup - Quick Start Guide

This is a simplified guide to get your app running on phones with a live backend.

---

## 🎯 Goal

Deploy backend → Configure app → Build APK → Install on phones → Test from any network

---

## Step 1: Deploy Backend (Choose One)

### Option A: Railway (Easiest - 5 minutes)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway auto-detects Node.js
5. Click **"New"** → **"Database"** → **"PostgreSQL"**
6. Copy the **DATABASE_URL** from database service
7. In backend service, add environment variables:
   ```
   DATABASE_URL=<paste-from-database>
   JWT_SECRET=<generate-with-command-below>
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=*
   ```
8. Generate JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
9. Railway will auto-deploy
10. Get your URL: `https://your-app-name.up.railway.app`

### Option B: Render (Free Tier)

1. Go to [render.com](https://render.com) → Sign up
2. **New** → **Web Service** → Connect GitHub repo
3. Configure:
   - Build: `cd backend && npm install && npm run build`
   - Start: `cd backend && npm start`
4. **New** → **PostgreSQL** → Create database
5. Add environment variables (same as Railway)
6. Deploy → Get URL: `https://your-app-name.onrender.com`

---

## Step 2: Configure Mobile App

### Update Production URLs

**File:** `GuardTrackingApp/src/config/apiConfig.ts`

```typescript
// Replace these with your live backend URLs
const PRODUCTION_API_URL = 'https://your-app-name.up.railway.app/api';
const PRODUCTION_WS_URL = 'https://your-app-name.up.railway.app';
```

**That's it!** All services now use this configuration automatically.

---

## Step 3: Build Android APK

### Generate Signing Key (One-time)

```bash
cd GuardTrackingApp/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore guard-tracking-key.keystore -alias guard-tracking-key -keyalg RSA -keysize 2048 -validity 10000
```

**Save the password!**

### Configure Gradle

**File:** `GuardTrackingApp/android/gradle.properties`

```properties
MYAPP_RELEASE_STORE_FILE=guard-tracking-key.keystore
MYAPP_RELEASE_KEY_ALIAS=guard-tracking-key
MYAPP_RELEASE_STORE_PASSWORD=your-password
MYAPP_RELEASE_KEY_PASSWORD=your-password
```

**File:** `GuardTrackingApp/android/app/build.gradle`

Add inside `android {` block:

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
```

### Build APK

```bash
cd GuardTrackingApp/android
./gradlew assembleRelease
```

**Windows:**
```bash
cd GuardTrackingApp\android
gradlew.bat assembleRelease
```

**APK Location:**
```
GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk
```

---

## Step 4: Install on Phones

### Method 1: USB (Fastest)

```bash
adb install GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk
```

### Method 2: Email/Cloud

1. Upload APK to Google Drive
2. Share link
3. Download on phone
4. Install (allow "Unknown Sources" if prompted)

### Method 3: QR Code

1. Upload APK to file sharing service
2. Generate QR code
3. Scan with phone
4. Download and install

---

## Step 5: Test

1. Open app on phone
2. Register/Login
3. Start a shift
4. Walk around
5. Check backend logs for location updates

---

## ✅ Checklist

- [ ] Backend deployed and accessible
- [ ] Database connected
- [ ] Environment variables set
- [ ] Production URLs updated in `apiConfig.ts`
- [ ] APK built successfully
- [ ] APK installed on test phones
- [ ] App connects to backend
- [ ] Location tracking works
- [ ] Tested from different networks

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect | Check backend URL in `apiConfig.ts` |
| Backend error | Check Railway/Render logs |
| APK won't install | Enable "Unknown Sources" in phone settings |
| Location not working | Check permissions on phone |

---

## 📝 Important Notes

1. **HTTPS Required:** Production URLs must use `https://`
2. **One Config File:** All API URLs are in `apiConfig.ts`
3. **Build Release Mode:** APK must be built in release mode (not debug)
4. **Test Backend First:** Verify backend works before building app

---

## 🎉 You're Done!

Your app should now work on phones from any network!

For detailed information, see `LIVE_DEPLOYMENT_GUIDE.md`



