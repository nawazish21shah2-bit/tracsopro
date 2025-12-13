# 🚀 Deployment Commands - Copy & Paste

Copy these commands one section at a time into your DigitalOcean console.

---

## Step 1: Update System & Install Prerequisites

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Install PM2 (process manager)
npm install -g pm2

# Verify installations
which node
which npm
which pm2
```

---

## Step 2: Setup PostgreSQL Database

```bash
# Switch to postgres user
su - postgres

# Create database and user (replace 'your_secure_password' with a strong password!)
psql -c "CREATE DATABASE tracsopro;"
psql -c "CREATE USER guard_user WITH PASSWORD 'your_secure_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE tracsopro TO guard_user;"
psql -c "ALTER USER guard_user CREATEDB;"

# Exit postgres user
exit
```

**⚠️ IMPORTANT:** Remember the password you set for `guard_user` - you'll need it in Step 4!

---

## Step 3: Configure Firewall

```bash
# Allow SSH (already open, but good to verify)
ufw allow 22/tcp

# Allow Node.js app port
ufw allow 3000/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## Step 4: Transfer Backend Files

**You need to transfer your backend folder to the server.**

### Option A: Using WinSCP (Recommended)

1. **Download WinSCP**: https://winscp.net/
2. **Open WinSCP**:
   - **File protocol**: SFTP
   - **Host name**: `143.110.198.38`
   - **Port**: `22`
   - **User name**: `root`
   - **Password**: (your droplet root password - you may need to reset it or use SSH key)
   - Click **Login**

3. **Transfer Files**:
   - **Left panel**: Navigate to `C:\learnings\tracsopro\backend`
   - **Right panel**: Navigate to `/root` on server
   - **Select all files** in backend folder (Ctrl+A)
   - **Drag and drop** to right panel
   - Wait for upload to complete

### Option B: Using Git (if your code is in a repository)

```bash
# Install Git
apt install git -y

# Clone your repository (replace with your repo URL)
cd /root
git clone <your-repo-url> tracsopro
cd tracsopro/backend
```

### Option C: Using SCP from PowerShell (Windows)

Open PowerShell on your Windows machine:

```powershell
cd C:\learnings\tracsopro
scp -r backend root@143.110.198.38:/root/
```

---

## Step 5: Setup Backend on Server

After files are transferred, run these commands in the console:

```bash
# Navigate to backend directory
cd /root/backend

# Verify files are there
ls -la

# Install dependencies (this may take a few minutes)
npm install
```

---

## Step 6: Create Environment File

```bash
# Create .env file
nano .env
```

**Paste this content** (replace the password with the one you set in Step 2):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://guard_user:your_secure_password@localhost:5432/tracsopro?schema=public
JWT_SECRET=change-this-to-a-random-secure-string-in-production
```

**To save in nano:**
- Press `Ctrl+X`
- Press `Y` (to confirm)
- Press `Enter` (to save)

**⚠️ Replace:**
- `your_secure_password` with the password from Step 2
- `change-this-to-a-random-secure-string-in-production` with a strong random string

---

## Step 7: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# Seed initial data (optional - creates test users)
npm run db:seed
```

---

## Step 8: Test the Server

```bash
# Start server manually to test
npm start
```

**You should see:**
```
🚀 Server running on http://0.0.0.0:3000
✅ Database connected successfully
```

**Press `Ctrl+C` to stop the test server.**

---

## Step 9: Start with PM2 (Production)

```bash
# Start the server with PM2
pm2 start npm --name "guard-tracking-api" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Copy and run the command it shows you (usually starts with 'sudo env PATH=...')
```

**After running the `pm2 startup` command, verify:**

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs guard-tracking-api

# Check if server is running
curl http://localhost:3000/api/health
```

---

## Step 10: Verify Deployment

### Test from Server

```bash
# Test health endpoint
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{"success":true,"data":{"status":"ok","time":"..."}}
```

### Test from Your Windows Machine

Open browser or PowerShell:

```powershell
# Test from Windows
curl http://143.110.198.38:3000/api/health
```

Or open in browser: **http://143.110.198.38:3000/api/health**

---

## ✅ Success!

If you see the health check response, your backend is deployed! 🎉

Your mobile app should now be able to connect to:
- **API**: `http://143.110.198.38:3000/api`
- **WebSocket**: `http://143.110.198.38:3000`

---

## 🔧 Useful PM2 Commands

```bash
# View logs
pm2 logs guard-tracking-api

# Restart app
pm2 restart guard-tracking-api

# Stop app
pm2 stop guard-tracking-api

# Check status
pm2 status

# Monitor resources
pm2 monit
```

---

## 🐛 Troubleshooting

### Server won't start

```bash
# Check PM2 logs
pm2 logs guard-tracking-api

# Check if port is in use
netstat -tulpn | grep 3000
```

### Database connection issues

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test database connection
psql -U guard_user -d tracsopro -h localhost
```

### Port 3000 not accessible from outside

```bash
# Check firewall
ufw status

# Verify app is listening on 0.0.0.0 (not 127.0.0.1)
netstat -tulpn | grep 3000
```

---

**Start with Step 1 and work through each step!**




