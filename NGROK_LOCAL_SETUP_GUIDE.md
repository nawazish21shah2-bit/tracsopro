# ngrok + Local Setup Guide (100% Free, No Credit Card)

Complete guide to run your backend locally and expose it publicly using ngrok.

---

## 🎯 What You'll Get

- ✅ **100% free** (no credit card)
- ✅ **Backend running on your computer**
- ✅ **Public URL via ngrok**
- ✅ **Free database (Supabase)**
- ✅ **Accessible from any network**
- ✅ **Full control**

**Limitation:** Your computer must be running for the backend to work

---

## 📋 Prerequisites

1. **Node.js installed** (you have this)
2. **Backend code** in `backend/` folder
3. **Internet connection**

---

## 🚀 Step-by-Step Setup

### Step 1: Install ngrok

#### Windows (PowerShell):
```powershell
# Download ngrok
Invoke-WebRequest https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip -OutFile ngrok.zip

# Extract
Expand-Archive ngrok.zip -DestinationPath C:\ngrok

# Add to PATH (optional but recommended)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\ngrok", "User")
```

**Or download manually:**
1. Go to [ngrok.com/download](https://ngrok.com/download)
2. Download Windows version
3. Extract to `C:\ngrok`
4. Add `C:\ngrok` to PATH (see below)

#### Add to PATH:
1. Press `Win + X` → **"System"**
2. **"Advanced system settings"** → **"Environment Variables"**
3. Under **"User variables"**, find **"Path"** → **"Edit"**
4. Click **"New"** → Add: `C:\ngrok`
5. Click **"OK"** on all windows
6. **Restart PowerShell**

#### Verify Installation:
```powershell
ngrok version
```

Should show: `ngrok version 3.x.x`

---

### Step 2: Sign Up for ngrok (Free)

1. Go to [ngrok.com](https://ngrok.com)
2. Click **"Sign Up"** (free, no credit card)
3. Sign up with email or GitHub
4. Verify your email
5. Go to **"Your Authtoken"** page
6. Copy your authtoken

#### Configure ngrok:
```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

**Verify:**
```powershell
ngrok config check
```

---

### Step 3: Setup Free Database (Supabase)

Since you need a database, use Supabase (free, no credit card):

#### Create Supabase Account:
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (no credit card)
4. Click **"New Project"**
5. Fill in:
   - **Name:** `guard-tracking-db`
   - **Database Password:** (create a strong password, save it!)
   - **Region:** Choose closest to you
6. Click **"Create new project"**
7. Wait ~2 minutes for database to be created

#### Get Database URL:
1. Go to **"Settings"** → **"Database"**
2. Scroll to **"Connection string"**
3. Select **"URI"** tab
4. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual password
6. Save this URL - you'll need it!

**Example:**
```
postgresql://postgres:MyPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

### Step 4: Configure Backend for Supabase

#### Update Backend Environment:

**File:** `backend/.env`

Create or update with:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
JWT_SECRET=<generate-below>
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
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:** Replace `DATABASE_URL` with your Supabase connection string!

---

### Step 5: Run Database Migrations

```powershell
cd backend
npm install
npm run db:generate
npm run db:push
npm run db:seed
```

This will:
1. Generate Prisma client
2. Push schema to Supabase
3. Seed test data

**Verify in Supabase:**
1. Go to Supabase dashboard
2. Click **"Table Editor"**
3. You should see your tables!

---

### Step 6: Start Backend Locally

```powershell
cd backend
npm run dev:db
```

Your backend should start on: `http://localhost:3000`

**Test locally:**
```powershell
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok"}`

---

### Step 7: Create ngrok Tunnel

**Open a NEW PowerShell window** (keep backend running in first window):

```powershell
ngrok http 3000
```

You'll see:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL:** `https://abc123xyz.ngrok-free.app`

**Important:** 
- This URL changes each time you restart ngrok
- For static URL, you need paid plan (but free is fine for testing!)

---

### Step 8: Update Mobile App

**File:** `GuardTrackingApp/src/config/apiConfig.ts`

```typescript
// Replace with your ngrok URL
const PRODUCTION_API_URL = 'https://abc123xyz.ngrok-free.app/api';
const PRODUCTION_WS_URL = 'https://abc123xyz.ngrok-free.app';
```

**Important:** Update this every time you restart ngrok (URL changes)

---

### Step 9: Test Everything

#### Test Backend:
```powershell
# Test health endpoint
curl https://abc123xyz.ngrok-free.app/api/health

# Should return: {"status":"ok"}
```

#### Test from Phone Browser:
1. Open browser on phone
2. Go to: `https://abc123xyz.ngrok-free.app/api/health`
3. Should see: `{"status":"ok"}`

#### Test from Mobile App:
1. Build APK (see below)
2. Install on phone
3. Open app
4. Try to register/login
5. Check backend logs for requests

---

## 🔨 Build and Install APK

### Build APK:
```powershell
cd GuardTrackingApp\android
.\gradlew.bat assembleRelease
```

### Install on Phone:
```powershell
adb install app\build\outputs\apk\release\app-release.apk
```

---

## 📊 ngrok Web Interface

ngrok provides a web interface to monitor requests:

1. Open browser: `http://127.0.0.1:4040`
2. See all requests in real-time
3. Inspect request/response
4. Replay requests
5. Very useful for debugging!

---

## 🔄 Daily Workflow

### Starting Your Backend:

1. **Start Backend:**
   ```powershell
   cd backend
   npm run dev:db
   ```

2. **Start ngrok (new terminal):**
   ```powershell
   ngrok http 3000
   ```

3. **Copy ngrok URL** and update `apiConfig.ts` if it changed

4. **Test:**
   ```powershell
   curl https://your-ngrok-url.ngrok-free.app/api/health
   ```

### Stopping:

1. Press `Ctrl+C` in backend terminal
2. Press `Ctrl+C` in ngrok terminal

---

## 💡 Pro Tips

### 1. Keep ngrok Running
- Don't close the ngrok terminal
- Keep it running while testing
- URL stays the same as long as ngrok is running

### 2. Monitor Requests
- Use ngrok web interface: `http://127.0.0.1:4040`
- See all API requests in real-time
- Great for debugging!

### 3. Handle URL Changes
- ngrok free tier: URL changes on restart
- Update `apiConfig.ts` when URL changes
- Or use ngrok paid plan for static URL ($8/month)

### 4. Database Management
- Use Supabase dashboard for database management
- View tables, run queries, manage data
- All free!

### 5. Keep Computer Awake
- Your computer must be running
- Don't put computer to sleep
- Or use "Keep Awake" software

---

## 🐛 Troubleshooting

### Issue 1: "ngrok: command not found"

**Solution:**
- Add ngrok to PATH (see Step 1)
- Or use full path: `C:\ngrok\ngrok.exe http 3000`

### Issue 2: "Database connection error"

**Solution:**
- Verify Supabase database is running
- Check DATABASE_URL in `.env` is correct
- Test connection from Supabase dashboard

### Issue 3: "Cannot connect from phone"

**Solution:**
- Verify ngrok is running
- Check ngrok URL is correct
- Test from phone browser first
- Check firewall allows ngrok

### Issue 4: "ngrok URL changed"

**Solution:**
- This is normal for free tier
- Update `apiConfig.ts` with new URL
- Or restart ngrok to get new URL

### Issue 5: "Backend not accessible"

**Solution:**
- Verify backend is running on port 3000
- Check ngrok is forwarding to port 3000
- Test locally: `curl http://localhost:3000/api/health`

---

## ✅ Complete Checklist

- [ ] ngrok installed and configured
- [ ] ngrok authtoken set
- [ ] Supabase account created
- [ ] Supabase database created
- [ ] DATABASE_URL added to backend/.env
- [ ] Database migrations run
- [ ] Backend running locally
- [ ] ngrok tunnel created
- [ ] ngrok URL copied
- [ ] Mobile app updated with ngrok URL
- [ ] Health endpoint tested
- [ ] Tested from phone browser
- [ ] APK built and installed
- [ ] App tested from phone

---

## 🎯 Quick Start Commands

```powershell
# Terminal 1: Start Backend
cd backend
npm run dev:db

# Terminal 2: Start ngrok
ngrok http 3000

# Terminal 3: Test
curl https://your-ngrok-url.ngrok-free.app/api/health
```

---

## 📱 Update Mobile App

Every time you restart ngrok, update:

**File:** `GuardTrackingApp/src/config/apiConfig.ts`

```typescript
const PRODUCTION_API_URL = 'https://NEW-NGROK-URL.ngrok-free.app/api';
const PRODUCTION_WS_URL = 'https://NEW-NGROK-URL.ngrok-free.app';
```

Then rebuild APK if needed.

---

## 🎉 You're All Set!

With this setup:
- ✅ Backend runs on your computer
- ✅ Publicly accessible via ngrok
- ✅ Free database (Supabase)
- ✅ No credit card needed
- ✅ Full control

**Limitations:**
- ⚠️ Computer must be running
- ⚠️ ngrok URL changes on restart (free tier)
- ⚠️ Internet required

**Perfect for:**
- Testing
- Development
- Small deployments
- Learning

---

## 🆘 Need Help?

1. Check ngrok web interface: `http://127.0.0.1:4040`
2. Check backend logs in terminal
3. Check Supabase dashboard
4. Test health endpoint
5. Verify ngrok is running

**You now have a free, working backend accessible from anywhere!** 🚀



