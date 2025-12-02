# Live Deployment Guide - Backend & Mobile App

This guide will help you deploy your backend to a live server and configure the mobile app to work with phones on different networks.

---

## 🎯 Overview

You'll need to:
1. **Deploy Backend** to a cloud service (Heroku, Railway, Render, etc.)
2. **Set up Database** (PostgreSQL)
3. **Configure Environment Variables**
4. **Build Android APK** with production API URL
5. **Install APK** on Android phones
6. **Test** from any network

---

## 🚀 Option 1: Deploy to Railway (Recommended - Easiest)

Railway is the easiest option with free tier and automatic deployments.

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 2: Deploy Backend
1. Click **"New"** → **"GitHub Repo"**
2. Select your repository
3. Railway will auto-detect Node.js

### Step 3: Add PostgreSQL Database
1. In your project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will create a database automatically
3. Copy the **DATABASE_URL** from the database service

### Step 4: Configure Environment Variables
In your backend service, add these environment variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-postgres-url-from-railway>
JWT_SECRET=<generate-a-strong-secret>
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=*
LOG_LEVEL=info
SOCKET_IO_ENABLED=true

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
OTP_RATE_LIMIT_WINDOW=300000
OTP_RATE_LIMIT_MAX=3
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Configure Build Settings
Railway should auto-detect, but verify:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Root Directory:** `backend`

### Step 6: Get Your Live URL
1. Railway will assign a URL like: `https://your-app-name.up.railway.app`
2. Copy this URL - you'll need it for the app

---

## 🌐 Option 2: Deploy to Render (Free Tier Available)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** guard-tracking-backend
   - **Environment:** Node
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Root Directory:** (leave empty)

### Step 3: Add PostgreSQL Database
1. Click **"New"** → **"PostgreSQL"**
2. Create database
3. Copy **Internal Database URL**

### Step 4: Add Environment Variables
Same as Railway (see above)

### Step 5: Get Your Live URL
Render will assign: `https://your-app-name.onrender.com`

---

## ☁️ Option 3: Deploy to Heroku

### Step 1: Install Heroku CLI
```bash
# Windows
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Mac
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### Step 2: Login and Create App
```bash
heroku login
heroku create your-app-name
```

### Step 3: Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

### Step 4: Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set JWT_EXPIRES_IN=30m
heroku config:set REFRESH_TOKEN_EXPIRES_IN=7d
# ... add all other env vars
```

### Step 5: Deploy
```bash
cd backend
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a your-app-name
git push heroku main
```

### Step 6: Get Your Live URL
```bash
heroku info
# Your app will be at: https://your-app-name.herokuapp.com
```

---

## 📦 Prepare Backend for Deployment

### 1. Update package.json Scripts

Ensure your `backend/package.json` has:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc -p tsconfig.json",
    "postinstall": "npm run build && prisma generate"
  }
}
```

### 2. Create Procfile (for Heroku/Railway)

Create `backend/Procfile`:
```
web: npm start
```

### 3. Update Database Configuration

Ensure `backend/src/config/database.ts` uses `DATABASE_URL` from environment:

```typescript
const DATABASE_URL = process.env.DATABASE_URL;
```

### 4. Run Database Migrations

After deployment, run migrations:

```bash
# For Railway/Render (via dashboard or CLI)
npm run db:migrate

# For Heroku
heroku run npm run db:migrate
```

### 5. Seed Database (Optional)

```bash
# Railway/Render
npm run db:seed

# Heroku
heroku run npm run db:seed
```

---

## 📱 Configure Mobile App for Production

### Step 1: Update API URLs

Update these files to use your live backend URL:

#### File 1: `GuardTrackingApp/src/services/api.ts`

```typescript
constructor() {
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  const PRODUCTION_API_URL = 'https://your-app-name.up.railway.app/api'; // ← Your live URL
  
  this.baseURL = isDev
    ? (Platform.OS === 'android'
        ? `http://${LOCAL_IP}:3000/api`
        : `http://${LOCAL_IP}:3000/api`)
    : PRODUCTION_API_URL; // ← Use production URL when not in dev mode
  // ... rest of code
}
```

#### File 2: `GuardTrackingApp/src/services/WebSocketService.ts`

```typescript
async connect(): Promise<void> {
  // ... existing code ...
  
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  const PRODUCTION_WS_URL = 'https://your-app-name.up.railway.app'; // ← Your live URL
  
  const baseURL = isDev
    ? `http://${LOCAL_IP}:3000`
    : PRODUCTION_WS_URL; // ← Use production URL when not in dev mode
  
  // ... rest of code
}
```

#### File 3: `GuardTrackingApp/src/services/shiftReportService.ts`

```typescript
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
const API_URL = isDev
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api'
  : 'https://your-app-name.up.railway.app/api'; // ← Your live URL
```

#### File 4: `GuardTrackingApp/src/services/shiftService.ts`

Update similarly to use production URL.

#### File 5: `GuardTrackingApp/src/services/siteService.ts`

Update similarly to use production URL.

### Step 2: Create Environment Configuration (Optional but Recommended)

Create `GuardTrackingApp/.env.production`:

```env
API_BASE_URL=https://your-app-name.up.railway.app/api
WS_BASE_URL=https://your-app-name.up.railway.app
```

Then use `react-native-config` or `react-native-dotenv` to load it.

---

## 🔨 Build Android APK

### Step 1: Generate Signing Key

```bash
cd GuardTrackingApp/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore guard-tracking-key.keystore -alias guard-tracking-key -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** Save the password and keystore file securely!

### Step 2: Configure Gradle

Edit `GuardTrackingApp/android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=guard-tracking-key.keystore
MYAPP_RELEASE_KEY_ALIAS=guard-tracking-key
MYAPP_RELEASE_STORE_PASSWORD=your-keystore-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

### Step 3: Update build.gradle

Edit `GuardTrackingApp/android/app/build.gradle`:

```gradle
android {
    ...
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
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

### Step 4: Build Release APK

```bash
cd GuardTrackingApp/android
./gradlew assembleRelease
```

**For Windows:**
```bash
cd GuardTrackingApp\android
gradlew.bat assembleRelease
```

### Step 5: Find Your APK

The APK will be at:
```
GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk
```

---

## 📲 Install APK on Android Phones

### Method 1: Direct Transfer (USB)

1. Connect phone to computer via USB
2. Enable **USB Debugging** on phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable USB Debugging
3. Copy APK to phone:
   ```bash
   adb install GuardTrackingApp/android/app/build/outputs/apk/release/app-release.apk
   ```
4. Or manually copy APK file to phone and install

### Method 2: Email/Cloud Transfer

1. Upload APK to Google Drive, Dropbox, or email
2. Download on phone
3. Open file manager → Install APK
4. Allow "Install from Unknown Sources" if prompted

### Method 3: QR Code (Easiest)

1. Upload APK to a file sharing service
2. Generate QR code with APK download link
3. Scan QR code on phone
4. Download and install

---

## ✅ Testing Checklist

### Backend Deployment
- [ ] Backend deployed and accessible
- [ ] Database connected
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Health endpoint works: `https://your-url.com/api/health`
- [ ] WebSocket connection works

### Mobile App
- [ ] API URL updated to production
- [ ] WebSocket URL updated to production
- [ ] APK built successfully
- [ ] APK installed on test phones
- [ ] App can connect to backend
- [ ] Login works
- [ ] Location tracking works
- [ ] Real-time features work

### Network Testing
- [ ] Test from phone on same network
- [ ] Test from phone on different network (mobile data)
- [ ] Test from phone on different Wi-Fi network
- [ ] Test from multiple phones simultaneously

---

## 🧪 Test Your Deployment

### 1. Test Backend Health

```bash
curl https://your-app-name.up.railway.app/api/health
```

Should return:
```json
{"status":"ok"}
```

### 2. Test from Phone Browser

Open on phone:
```
https://your-app-name.up.railway.app/api/health
```

### 3. Test API Endpoints

```bash
# Register
curl -X POST https://your-app-name.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","role":"GUARD"}'

# Login
curl -X POST https://your-app-name.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 4. Test from App

1. Open app on phone
2. Try to register/login
3. Check backend logs for requests
4. Verify location tracking works

---

## 🔒 Security Considerations

### 1. HTTPS Only
- All production URLs should use `https://`
- Never use `http://` in production

### 2. CORS Configuration
Update CORS in backend to allow your app:

```typescript
// backend/src/app.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // In production, specify exact origins
  credentials: true
}));
```

### 3. Environment Variables
- Never commit `.env` files
- Use platform's environment variable management
- Rotate JWT_SECRET regularly

### 4. Database Security
- Use strong database passwords
- Enable SSL for database connections
- Regular backups

---

## 🐛 Troubleshooting

### Backend Not Accessible

**Problem:** Can't reach backend from phone

**Solutions:**
1. Check backend URL is correct (https, not http)
2. Verify backend is running (check platform dashboard)
3. Check CORS settings allow your requests
4. Test from phone browser first

### Database Connection Errors

**Problem:** Backend can't connect to database

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check database is running (platform dashboard)
3. Ensure SSL is enabled if required
4. Check database credentials

### APK Installation Fails

**Problem:** Can't install APK on phone

**Solutions:**
1. Enable "Install from Unknown Sources" in phone settings
2. Check APK is not corrupted (rebuild)
3. Ensure phone has enough storage
4. Try different installation method

### App Can't Connect to Backend

**Problem:** App shows network errors

**Solutions:**
1. Verify API URL is correct in code
2. Check phone has internet connection
3. Test backend health endpoint from phone browser
4. Check backend logs for errors
5. Verify CORS allows requests from app

### Location Tracking Not Working

**Problem:** Location not updating on server

**Solutions:**
1. Check location permissions granted
2. Verify GPS enabled on phone
3. Check backend logs for location update requests
4. Test API endpoint manually
5. Check WebSocket connection

---

## 📊 Monitoring Your Deployment

### Railway Dashboard
- View logs in real-time
- Monitor resource usage
- Check deployment status

### Render Dashboard
- View logs and metrics
- Monitor service health

### Heroku Dashboard
- View logs: `heroku logs --tail`
- Monitor dyno usage
- Check add-on status

### Backend Logs
Monitor for:
- API requests
- Errors
- WebSocket connections
- Database queries

---

## 🔄 Updating Your Deployment

### Update Backend Code

**Railway/Render:**
- Push to GitHub
- Automatic deployment triggers

**Heroku:**
```bash
git push heroku main
```

### Update Mobile App

1. Make code changes
2. Update API URLs if backend URL changed
3. Rebuild APK
4. Distribute new APK to testers

---

## 📝 Quick Reference

### Backend URLs
- **Development:** `http://localhost:3000`
- **Production:** `https://your-app-name.up.railway.app`

### Database
- **Development:** SQLite (`file:./dev.db`)
- **Production:** PostgreSQL (from platform)

### Mobile App
- **Development:** Uses local IP
- **Production:** Uses live backend URL

### Build Commands
```bash
# Backend
npm run build
npm start

# Mobile App (Android)
cd android
./gradlew assembleRelease
```

---

## 🎯 Next Steps

1. ✅ Deploy backend to chosen platform
2. ✅ Set up database
3. ✅ Configure environment variables
4. ✅ Update app with production URLs
5. ✅ Build APK
6. ✅ Install on test phones
7. ✅ Test from different networks
8. ✅ Monitor and iterate

---

## 💡 Pro Tips

1. **Start with Railway** - Easiest setup, free tier available
2. **Test backend first** - Verify it works before building app
3. **Use staging environment** - Test changes before production
4. **Monitor logs** - Keep an eye on backend logs during testing
5. **Backup database** - Regular backups are essential
6. **Version your APKs** - Keep track of which version testers have

---

## 🆘 Need Help?

If you encounter issues:
1. Check backend logs in platform dashboard
2. Test backend endpoints manually
3. Verify environment variables
4. Check database connection
5. Review this troubleshooting section

Good luck with your deployment! 🚀



