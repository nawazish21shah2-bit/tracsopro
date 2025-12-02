# Fly.io Deployment Guide - Monorepo Setup

Complete guide to deploy your backend to Fly.io with your monorepo structure.

---

## 🎯 Why Fly.io?

- ✅ **Free tier available** (3 shared VMs)
- ✅ **No cold starts** (always running)
- ✅ **Fast performance**
- ✅ **WebSocket support** ✅
- ✅ **PostgreSQL available**
- ✅ **Works with monorepo** structure

---

## 📋 Prerequisites

1. **Fly.io CLI installed**
2. **GitHub account** (for your repo)
3. **Your backend code** in `backend/` folder

---

## 🚀 Step-by-Step Deployment

### Step 1: Install Fly.io CLI

**Windows (PowerShell):**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Verify installation:**
```bash
fly version
```

---

### Step 2: Sign Up / Login

```bash
fly auth signup
```

Or if you already have an account:
```bash
fly auth login
```

This will open your browser to sign up/login.

---

### Step 3: Navigate to Backend Folder

```bash
cd backend
```

**Important:** All Fly.io commands must be run from the `backend/` folder.

---

### Step 4: Initialize Fly.io App

```bash
fly launch
```

This will:
1. Ask for app name (or auto-generate one)
2. Ask for region (choose closest to you)
3. Ask if you want a PostgreSQL database (say **YES**)
4. Ask if you want a Redis database (say **NO** for now)
5. Create `fly.toml` configuration file

**Example:**
```
? App Name: guard-tracking-backend
? Select region: ord (Chicago, Illinois (US))
? Would you like to set up a Postgresql database now? Yes
? Would you like to set up a Redis database now? No
```

---

### Step 5: Configure fly.toml

After `fly launch`, you'll have a `fly.toml` file. Update it:

**File:** `backend/fly.toml`

```toml
app = "guard-tracking-backend"
primary_region = "ord"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[services]]
  protocol = "tcp"
  internal_port = 3000
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/api/health"
```

**Key settings:**
- `internal_port = 3000` - Your app port
- `min_machines_running = 1` - Keeps app running (no cold starts)
- `auto_stop_machines = false` - Prevents auto-stop
- Health check on `/api/health`

---

### Step 6: Create Dockerfile (If Needed)

Fly.io can auto-detect Node.js, but if you need a custom Dockerfile:

**File:** `backend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
```

**Or use buildpacks (simpler):**

Fly.io can auto-detect and use buildpacks. You might not need a Dockerfile if your `package.json` has the right scripts.

---

### Step 7: Set Environment Variables

```bash
# Set JWT secret
fly secrets set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set other secrets
fly secrets set JWT_EXPIRES_IN=30m
fly secrets set REFRESH_TOKEN_EXPIRES_IN=7d
fly secrets set BCRYPT_ROUNDS=10
fly secrets set CORS_ORIGIN=*
fly secrets set LOG_LEVEL=info
fly secrets set SOCKET_IO_ENABLED=true

# Email configuration
fly secrets set SMTP_HOST=smtp.gmail.com
fly secrets set SMTP_PORT=587
fly secrets set SMTP_USER=your-email@gmail.com
fly secrets set SMTP_PASS=your-app-password
fly secrets set SMTP_FROM=your-email@gmail.com

# OTP configuration
fly secrets set OTP_LENGTH=6
fly secrets set OTP_EXPIRY_MINUTES=10
fly secrets set OTP_MAX_ATTEMPTS=5
fly secrets set OTP_RATE_LIMIT_WINDOW=300000
fly secrets set OTP_RATE_LIMIT_MAX=3
```

**Note:** `DATABASE_URL` is automatically set by Fly.io when you create PostgreSQL database.

**View all secrets:**
```bash
fly secrets list
```

---

### Step 8: Configure Database Connection

If you created PostgreSQL during `fly launch`, the `DATABASE_URL` is automatically set.

**Verify database:**
```bash
fly postgres list
```

**Get database connection info:**
```bash
fly postgres connect -a guard-tracking-backend-db
```

**Or check in fly.toml:**
```bash
fly status
```

---

### Step 9: Update package.json Scripts (If Needed)

Make sure your `backend/package.json` has:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc -p tsconfig.json",
    "postinstall": "prisma generate"
  }
}
```

The `postinstall` script ensures Prisma client is generated after `npm install`.

---

### Step 10: Deploy

```bash
fly deploy
```

This will:
1. Build your app
2. Create a Docker image
3. Deploy to Fly.io
4. Start your app

**Watch the logs:**
```bash
fly logs
```

---

### Step 11: Run Database Migrations

After deployment, run migrations:

```bash
# Connect to app and run migrations
fly ssh console -C "npm run db:generate && npm run db:push"

# Or run migrations locally (if DATABASE_URL is set)
fly postgres connect -a guard-tracking-backend-db
# Then in psql:
# \c your_database_name
# Then run migrations from your local machine with DATABASE_URL
```

**Better approach - Add to deploy script:**

Create `backend/fly.toml` with release command:

```toml
[deploy]
  release_command = "npm run db:generate && npm run db:push"
```

Or add to `package.json`:

```json
{
  "scripts": {
    "fly:deploy": "npm run db:generate && npm run db:push && fly deploy"
  }
}
```

---

### Step 12: Get Your App URL

```bash
fly status
```

Your app will be at: `https://guard-tracking-backend.fly.dev`

**Or check:**
```bash
fly info
```

---

## ✅ Verify Deployment

### 1. Test Health Endpoint

```bash
curl https://guard-tracking-backend.fly.dev/api/health
```

Should return: `{"status":"ok"}`

### 2. Check Logs

```bash
fly logs
```

### 3. Check Status

```bash
fly status
```

---

## 📱 Update Mobile App

**File:** `GuardTrackingApp/src/config/apiConfig.ts`

```typescript
const PRODUCTION_API_URL = 'https://guard-tracking-backend.fly.dev/api';
const PRODUCTION_WS_URL = 'https://guard-tracking-backend.fly.dev';
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot find module"

**Problem:** Dependencies not installed

**Solution:**
- Ensure `package.json` has all dependencies
- Check `postinstall` script runs Prisma generate
- Rebuild: `fly deploy --no-cache`

### Issue 2: "Database connection error"

**Problem:** DATABASE_URL not set

**Solution:**
```bash
# Check if database exists
fly postgres list

# Get connection string
fly postgres connect -a your-db-name

# Verify DATABASE_URL is set
fly secrets list
```

### Issue 3: "Port not accessible"

**Problem:** App not listening on correct port

**Solution:**
- Ensure app listens on `process.env.PORT || 3000`
- Check `fly.toml` has `internal_port = 3000`
- Verify your server code uses the port from environment

### Issue 4: "Build fails"

**Problem:** TypeScript or build errors

**Solution:**
```bash
# Test build locally first
cd backend
npm install
npm run build

# If it works locally, deploy
fly deploy
```

### Issue 5: "WebSocket not working"

**Problem:** WebSocket configuration

**Solution:**
- Ensure `force_https = true` in `fly.toml`
- Check CORS settings allow WebSocket
- Verify Socket.IO is configured correctly

---

## 🛠️ Useful Fly.io Commands

```bash
# View app status
fly status

# View logs
fly logs

# SSH into app
fly ssh console

# Scale app
fly scale count 1

# View secrets
fly secrets list

# Set secret
fly secrets set KEY=value

# Remove secret
fly secrets unset KEY

# View app info
fly info

# Open app in browser
fly open

# View metrics
fly metrics
```

---

## 💰 Free Tier Limits

**Fly.io Free Tier:**
- 3 shared VMs
- 3GB storage
- 160GB outbound data/month
- PostgreSQL available (separate free tier)
- **No cold starts** ✅
- **Always running** ✅

**PostgreSQL Free Tier:**
- 256MB storage
- 1GB RAM
- Enough for testing

---

## 🔄 Updating Your App

### Deploy Updates

```bash
cd backend
fly deploy
```

### Run Migrations After Update

```bash
fly ssh console -C "npm run db:push"
```

Or add to `fly.toml`:

```toml
[deploy]
  release_command = "npm run db:generate && npm run db:push"
```

---

## 📊 Monitoring

### View Logs

```bash
# Real-time logs
fly logs

# Follow logs
fly logs -a guard-tracking-backend
```

### View Metrics

```bash
fly metrics
```

### Check Status

```bash
fly status
```

---

## 🎯 Complete Checklist

- [ ] Fly.io CLI installed
- [ ] Logged in: `fly auth login`
- [ ] In `backend/` folder
- [ ] Initialized: `fly launch`
- [ ] PostgreSQL database created
- [ ] `fly.toml` configured
- [ ] Environment variables set
- [ ] `package.json` has correct scripts
- [ ] Deployed: `fly deploy`
- [ ] Database migrations run
- [ ] Health endpoint works
- [ ] Mobile app updated with Fly.io URL
- [ ] APK built and tested

---

## 🚀 Quick Start Summary

```bash
# 1. Install CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Go to backend folder
cd backend

# 4. Initialize
fly launch
# Say YES to PostgreSQL

# 5. Set secrets
fly secrets set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# ... set other secrets

# 6. Deploy
fly deploy

# 7. Run migrations
fly ssh console -C "npm run db:generate && npm run db:push"

# 8. Test
curl https://your-app.fly.dev/api/health
```

---

## 💡 Pro Tips

1. **Keep App Running:**
   - Set `min_machines_running = 1` in `fly.toml`
   - Prevents cold starts

2. **Database Migrations:**
   - Add `release_command` to `fly.toml` for auto-migrations
   - Or run manually after each deploy

3. **Monitor Logs:**
   - Use `fly logs` to debug issues
   - Check for errors during deployment

4. **Scale When Needed:**
   - Free tier: 1 machine
   - Scale up: `fly scale count 2` (paid)

5. **Backup Database:**
   - Fly.io PostgreSQL has automatic backups
   - Check dashboard for backup options

---

## 🎉 You're All Set!

Your backend is now deployed to Fly.io:
- ✅ No cold starts
- ✅ Always running
- ✅ WebSocket support
- ✅ PostgreSQL database
- ✅ Free tier available

**Your URL:** `https://your-app.fly.dev`

**Next Steps:**
1. Update mobile app with Fly.io URL
2. Build APK
3. Test from phones on different networks

Good luck! 🚀



