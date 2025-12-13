# 🚀 DigitalOcean Droplet Deployment Guide (Windows + PuTTY)

Complete step-by-step guide to deploy your Guard Tracking backend to DigitalOcean using PuTTY.

## 📋 Prerequisites

1. **PuTTY** - Download from: https://www.putty.org/
2. **WinSCP** (for file transfer) - Download from: https://winscp.net/
3. **DigitalOcean Droplet** - Already set up at `143.110.198.38`

---

## 🔐 Step 1: Connect to Droplet via PuTTY

### 1.1 Open PuTTY

1. Launch **PuTTY**
2. In the **Host Name (or IP address)** field, enter: `143.110.198.38`
3. **Port**: `22` (default SSH port)
4. **Connection type**: SSH
5. Click **Open**

### 1.2 First Connection

- You'll see a security alert - click **Yes** to accept the server's host key
- Login as: `root`
- Enter your password (you set this when creating the droplet)

---

## 🛠️ Step 2: Initial Server Setup

Once connected, run these commands in PuTTY:

### 2.1 Update System

```bash
apt update && apt upgrade -y
```

### 2.2 Install Node.js 20.x

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.3 Install PostgreSQL

```bash
# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
systemctl start postgresql
systemctl enable postgresql

# Check status
systemctl status postgresql
```

### 2.4 Configure PostgreSQL Database

```bash
# Switch to postgres user
su - postgres

# Create database and user
psql -c "CREATE DATABASE guard_tracking;"
psql -c "CREATE USER guard_user WITH PASSWORD 'your_secure_password_here';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE guard_tracking TO guard_user;"
psql -c "ALTER USER guard_user CREATEDB;"

# Exit postgres user
exit
```

**⚠️ IMPORTANT:** Replace `'your_secure_password_here'` with a strong password!

### 2.5 Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### 2.6 Configure Firewall

```bash
# Allow SSH (already open)
ufw allow 22/tcp

# Allow Node.js app port
ufw allow 3000/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## 📁 Step 3: Transfer Backend Files

### Option A: Using WinSCP (Recommended)

1. **Open WinSCP**
2. **New Session**:
   - **File protocol**: SFTP
   - **Host name**: `143.110.198.38`
   - **Port number**: `22`
   - **User name**: `root`
   - **Password**: (your droplet password)
   - Click **Login**

3. **Transfer Files**:
   - **Left panel**: Navigate to `C:\learnings\tracsopro\backend`
   - **Right panel**: Navigate to `/root` (or create `/var/www/guard-tracking`)
   - **Select all files** in the backend folder (Ctrl+A)
   - **Drag and drop** to the right panel
   - Wait for upload to complete

### Option B: Using Git (Alternative)

If your code is in a Git repository:

```bash
# Install Git
apt install git -y

# Clone your repository
cd /root
git clone <your-repo-url> tracsopro
cd tracsopro/backend
```

### Option C: Using SCP from PowerShell

Open PowerShell on Windows:

```powershell
# Navigate to backend folder
cd C:\learnings\tracsopro

# Transfer entire backend folder
scp -r backend root@143.110.198.38:/root/
```

---

## ⚙️ Step 4: Setup Backend on Server

Back in PuTTY, navigate to the backend directory:

```bash
# Navigate to backend
cd /root/backend
# OR if you used /var/www/guard-tracking:
# cd /var/www/guard-tracking/backend

# List files to verify
ls -la
```

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Create Environment File

```bash
# Create .env file
nano .env
```

**Add the following content** (press `Ctrl+X`, then `Y`, then `Enter` to save):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://guard_user:your_secure_password_here@localhost:5432/guard_tracking?schema=public
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**⚠️ Replace:**
- `your_secure_password_here` with the PostgreSQL password you set earlier
- `your-super-secret-jwt-key-change-this-in-production` with a strong random string

### 4.3 Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (creates all tables)
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

### 4.4 Test the Server

```bash
# Start server manually to test
npm start
```

You should see:
```
🚀 Server running on http://0.0.0.0:3000
✅ Database connected successfully
```

**Press `Ctrl+C` to stop the test server.**

---

## 🚀 Step 5: Start with PM2 (Production)

### 5.1 Start Application with PM2

```bash
# Start the server
pm2 start npm --name "guard-tracking-api" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions it prints (usually run a sudo command)
```

### 5.2 PM2 Useful Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs guard-tracking-api

# Restart app
pm2 restart guard-tracking-api

# Stop app
pm2 stop guard-tracking-api

# Monitor
pm2 monit
```

---

## ✅ Step 6: Verify Deployment

### 6.1 Test from Server

In PuTTY:

```bash
# Test health endpoint
curl http://localhost:3000/api/health
```

Should return:
```json
{"success":true,"data":{"status":"ok","time":"..."}}
```

### 6.2 Test from Your Windows Machine

Open browser or PowerShell:

```powershell
# Test from Windows
curl http://143.110.198.38:3000/api/health
```

Or open in browser: `http://143.110.198.38:3000/api/health`

---

## 🔒 Step 7: Security Hardening (Optional but Recommended)

### 7.1 Create Non-Root User

```bash
# Create new user
adduser guardapp

# Add to sudo group
usermod -aG sudo guardapp

# Switch to new user
su - guardapp
```

### 7.2 Setup SSH Key Authentication

On Windows, generate SSH key:

```powershell
# In PowerShell
ssh-keygen -t rsa -b 4096
```

Copy public key to server:

```powershell
# Copy to server
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@143.110.198.38 "cat >> ~/.ssh/authorized_keys"
```

---

## 🔧 Troubleshooting

### Server Won't Start

```bash
# Check logs
pm2 logs guard-tracking-api

# Check if port is in use
netstat -tulpn | grep 3000

# Check database connection
psql -U guard_user -d guard_tracking -h localhost
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log

# Test connection
psql -U guard_user -d guard_tracking -h localhost
```

### Port 3000 Not Accessible

```bash
# Check firewall
ufw status

# Check if app is listening on 0.0.0.0
netstat -tulpn | grep 3000

# Should show: 0.0.0.0:3000 (not 127.0.0.1:3000)
```

### PM2 Issues

```bash
# Restart PM2 daemon
pm2 kill
pm2 resurrect

# Or restart app
pm2 restart guard-tracking-api
```

---

## 📝 Quick Reference Commands

```bash
# Connect via PuTTY
Host: 143.110.198.38
Port: 22
User: root

# Navigate to app
cd /root/backend

# View logs
pm2 logs guard-tracking-api

# Restart app
pm2 restart guard-tracking-api

# Check status
pm2 status

# Update code (after transferring new files)
cd /root/backend
npm install
npm run db:push
pm2 restart guard-tracking-api
```

---

## 🎯 Next Steps

1. ✅ **Backend is deployed** at `http://143.110.198.38:3000`
2. ✅ **API Config updated** in `GuardTrackingApp/src/config/apiConfig.ts`
3. 🔄 **Test your mobile app** - it should now connect to the droplet
4. 🔒 **Setup HTTPS** (recommended for production):
   - Get a domain name
   - Setup Let's Encrypt SSL certificate
   - Configure nginx reverse proxy
5. 📊 **Setup monitoring** - Consider DigitalOcean monitoring or PM2 monitoring

---

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs guard-tracking-api`
2. Check system logs: `journalctl -u postgresql`
3. Verify firewall: `ufw status`
4. Test database: `psql -U guard_user -d guard_tracking`

---

**🎉 Your backend is now live on DigitalOcean!**




