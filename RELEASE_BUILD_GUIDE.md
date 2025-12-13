# 🚀 Release Build Guide - Production Deployment

Complete guide to build a production release of your Guard Tracking App that connects to your DigitalOcean backend.

## ✅ Pre-Build Checklist

- [x] Backend deployed on DigitalOcean (`143.110.198.38:3000`)
- [x] API config updated to production URL
- [x] Database configured and running
- [ ] Release build configured

---

## 📱 Step 1: Verify Production Configuration

Your API config is already set to production:
- **Production API**: `http://143.110.198.38:3000/api`
- **Production WebSocket**: `http://143.110.198.38:3000`

The app automatically uses production URLs when built in **release mode** (not `__DEV__`).

---

## 🔧 Step 2: Android Release Build

### 2.1 Generate Signing Keystore (First Time Only)

For production, you need a signing keystore. Run this **once**:

```bash
cd GuardTrackingApp/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore guard-tracking-release.keystore -alias guard-tracking-key -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: 
- Remember the password you set!
- Store the keystore file safely (you'll need it for updates)
- Don't commit the keystore to Git

### 2.2 Configure Signing in build.gradle

Edit `GuardTrackingApp/android/app/build.gradle`:

```gradle
android {
    // ... existing code ...
    
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
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
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

### 2.3 Create gradle.properties

Create/edit `GuardTrackingApp/android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=guard-tracking-release.keystore
MYAPP_RELEASE_KEY_ALIAS=guard-tracking-key
MYAPP_RELEASE_STORE_PASSWORD=your_keystore_password
MYAPP_RELEASE_KEY_PASSWORD=your_keystore_password
```

**⚠️ Security Note**: Add `gradle.properties` to `.gitignore` to avoid committing passwords!

### 2.4 Build Release APK

```bash
cd GuardTrackingApp/android

# Clean previous builds
./gradlew clean

# Build release APK
./gradlew assembleRelease
```

The APK will be at:
```
GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk
```

### 2.5 Build Release AAB (for Google Play Store)

```bash
cd GuardTrackingApp/android
./gradlew bundleRelease
```

The AAB will be at:
```
GuardTrackingApp/android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🍎 Step 3: iOS Release Build (macOS Only)

### 3.1 Configure Code Signing

1. Open `GuardTrackingApp/ios/GuardTrackingApp.xcworkspace` in Xcode
2. Select your project in the navigator
3. Go to **Signing & Capabilities**
4. Select your **Team** and **Provisioning Profile**

### 3.2 Build Release

```bash
cd GuardTrackingApp/ios

# Install pods (if not done)
pod install

# Build release
xcodebuild -workspace GuardTrackingApp.xcworkspace \
           -scheme GuardTrackingApp \
           -configuration Release \
           -destination generic/platform=iOS \
           -archivePath build/GuardTrackingApp.xcarchive \
           archive
```

### 3.3 Export IPA

1. Open Xcode
2. **Product** → **Archive**
3. Once archived, click **Distribute App**
4. Choose distribution method (App Store, Ad Hoc, Enterprise, or Development)

---

## 🧪 Step 4: Test Release Build

### 4.1 Install on Device

**Android:**
```bash
# Install via ADB
adb install GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk
```

**iOS:**
- Use Xcode to install on connected device
- Or use TestFlight for beta testing

### 4.2 Verify Production Connection

1. **Open the app** on your device
2. **Check API connection**:
   - Try logging in
   - The app should connect to `http://143.110.198.38:3000/api`
3. **Verify in logs** (if accessible):
   - Should show production API URL
   - Should NOT show `__DEV__ = true`

### 4.3 Test Key Features

- [ ] Login/Registration
- [ ] Location tracking
- [ ] Incident reporting
- [ ] Real-time updates
- [ ] Push notifications (if configured)

---

## 📦 Step 5: Distribution

### Android Distribution Options

**Option A: Direct APK Distribution**
- Share the APK file directly
- Users need to enable "Install from Unknown Sources"
- Good for internal testing

**Option B: Google Play Store**
- Upload AAB to Google Play Console
- Follow Google Play guidelines
- Requires Google Play Developer account ($25 one-time fee)

**Option C: Firebase App Distribution**
- Upload APK/AAB to Firebase
- Share with testers via email
- Free for testing

### iOS Distribution Options

**Option A: TestFlight (Beta Testing)**
- Upload to App Store Connect
- Invite testers via email
- Up to 10,000 testers

**Option B: App Store**
- Submit for App Store review
- Requires Apple Developer account ($99/year)

**Option C: Enterprise Distribution**
- For internal company use
- Requires Enterprise Developer account ($299/year)

---

## 🔒 Step 6: Security Checklist

Before distributing:

- [ ] **API Security**: Consider setting up HTTPS (Let's Encrypt)
- [ ] **API Keys**: Ensure no hardcoded secrets in app
- [ ] **CORS**: Configure backend CORS for your app domain
- [ ] **Keystore**: Securely store signing keys
- [ ] **ProGuard**: Enabled for code obfuscation
- [ ] **Logging**: Disable debug logs in production

---

## 🚀 Step 7: Update Backend for HTTPS (Recommended)

For production, set up HTTPS:

### 7.1 Install Certbot

On your DigitalOcean droplet:

```bash
apt install certbot -y
```

### 7.2 Get SSL Certificate

```bash
# If you have a domain pointing to your droplet
certbot certonly --standalone -d yourdomain.com
```

### 7.3 Update API Config

After HTTPS is set up, update `GuardTrackingApp/src/config/apiConfig.ts`:

```typescript
const PRODUCTION_API_URL = 'https://yourdomain.com/api';
const PRODUCTION_WS_URL = 'https://yourdomain.com';
```

Then rebuild the app.

---

## 📝 Quick Build Commands Reference

### Android

```bash
# Clean build
cd GuardTrackingApp/android && ./gradlew clean

# Build APK
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease

# Install on connected device
adb install app/build/outputs/apk/release/app-release.apk
```

### iOS

```bash
# Clean build
cd GuardTrackingApp/ios && xcodebuild clean

# Build archive
xcodebuild -workspace GuardTrackingApp.xcworkspace \
           -scheme GuardTrackingApp \
           -configuration Release \
           archive
```

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Clean everything
cd GuardTrackingApp
rm -rf node_modules
rm -rf android/app/build
rm -rf ios/build

# Reinstall
npm install
cd android && ./gradlew clean
cd ../ios && pod install
```

### App Won't Connect to Backend

1. **Check firewall**: Ensure port 3000 is open
2. **Check backend**: Verify server is running (`pm2 status`)
3. **Check API URL**: Verify production URL in `apiConfig.ts`
4. **Check network**: Ensure device has internet access

### Signing Errors

- Verify keystore file exists
- Check passwords in `gradle.properties`
- Ensure keystore path is correct

---

## ✅ Success Checklist

- [ ] Release build created successfully
- [ ] App installs on device
- [ ] App connects to production backend
- [ ] All features work correctly
- [ ] No debug logs in production
- [ ] Signing configured properly
- [ ] Ready for distribution

---

## 🎯 Next Steps

1. **Test thoroughly** on multiple devices
2. **Set up monitoring** (Sentry, Firebase Analytics)
3. **Configure push notifications** for production
4. **Set up CI/CD** for automated builds
5. **Plan app store submission** (if applicable)

---

**🎉 Your app is now ready for production deployment!**

**Backend**: `http://143.110.198.38:3000`  
**Database**: PostgreSQL on DigitalOcean  
**App**: Release build ready for distribution




