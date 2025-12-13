# 🔑 SSH Key Setup for PuTTY (DigitalOcean)

Your DigitalOcean droplet requires SSH key authentication. Here's how to set it up on Windows with PuTTY.

---

## 📋 Option 1: Use DigitalOcean Console (Easiest)

### Step 1: Generate SSH Key in DigitalOcean

1. Go to **DigitalOcean Dashboard** → **Settings** → **Security** → **SSH Keys**
2. Click **Add SSH Key**
3. **OR** use the **Console** button in your droplet (the one you saw in the browser)

### Step 2: Use DigitalOcean Web Console

1. In your droplet page, click the **"Console"** button
2. This opens a browser-based terminal - no SSH key needed!
3. You can run all commands directly there

---

## 🔧 Option 2: Generate SSH Key on Windows (For PuTTY)

### Step 2.1: Generate Key Pair

**Using PuTTYgen (comes with PuTTY):**

1. **Open PuTTYgen**:
   - Search for "PuTTYgen" in Windows Start menu
   - Or navigate to: `C:\Program Files\PuTTY\puttygen.exe`

2. **Generate Key**:
   - Click **"Generate"**
   - Move your mouse randomly over the blank area to generate randomness
   - Wait for key generation to complete

3. **Save Keys**:
   - **Key comment**: `tracsopro-droplet` (optional, for identification)
   - **Key passphrase**: (optional, but recommended for security)
   - Click **"Save private key"** → Save as `tracsopro-key.ppk` (remember location!)
   - Click **"Save public key"** → Save as `tracsopro-key.pub`

4. **Copy Public Key**:
   - The public key is shown in the text box at the top
   - **Select all** (Ctrl+A) and **Copy** (Ctrl+C)
   - It should look like: `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...`

### Step 2.2: Add Public Key to DigitalOcean Droplet

**Method A: Via DigitalOcean Dashboard**

1. Go to **DigitalOcean Dashboard** → **Settings** → **Security** → **SSH Keys**
2. Click **Add SSH Key**
3. **Paste your public key** (the one you copied from PuTTYgen)
4. Give it a name: `My Windows Key`
5. Click **Add SSH Key**

**Method B: Via Droplet Console (Browser)**

1. Click **"Console"** button in your droplet page
2. Run these commands:

```bash
# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (paste the key you copied from PuTTYgen)
nano ~/.ssh/authorized_keys
# Paste your public key, then Ctrl+X, Y, Enter to save

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

### Step 2.3: Configure PuTTY to Use Private Key

1. **Open PuTTY**

2. **Session Settings**:
   - **Host Name**: `143.110.198.38`
   - **Port**: `22`
   - **Connection type**: SSH

3. **Configure SSH Key**:
   - In the left sidebar, expand **Connection** → **SSH** → **Auth**
   - Click **"Browse..."** under **"Private key file for authentication"**
   - Select your `tracsopro-key.ppk` file
   - **Go back to "Session"** in the left sidebar

4. **Save Session** (optional but recommended):
   - Under **"Saved Sessions"**, type: `TracsoPro Droplet`
   - Click **"Save"**
   - Next time, just double-click the saved session!

5. **Connect**:
   - Click **"Open"**
   - If you set a passphrase, enter it when prompted
   - You should now connect successfully!

---

## 🚀 Option 3: Use PowerShell SSH (Windows 10/11)

If you have Windows 10/11, you can use built-in SSH:

### Step 3.1: Generate Key in PowerShell

```powershell
# Open PowerShell
ssh-keygen -t rsa -b 4096 -C "tracsopro-droplet"

# When prompted:
# - File location: Press Enter (default: C:\Users\YourName\.ssh\id_rsa)
# - Passphrase: (optional, press Enter for no passphrase)
```

### Step 3.2: Copy Public Key to Droplet

**Method A: Use DigitalOcean Console**

1. Open droplet **Console** in browser
2. Run:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

3. In PowerShell, get your public key:

```powershell
type $env:USERPROFILE\.ssh\id_rsa.pub
```

4. **Copy the output** and paste it into the `nano` editor on the droplet
5. Save: `Ctrl+X`, then `Y`, then `Enter`
6. Set permissions:

```bash
chmod 600 ~/.ssh/authorized_keys
```

**Method B: Use ssh-copy-id (if available)**

```powershell
# Install OpenSSH client if needed
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0

# Copy key (you'll need to enter password once)
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@143.110.198.38 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Step 3.3: Connect via PowerShell

```powershell
ssh root@143.110.198.38
```

---

## ✅ Verify Connection

Once connected, you should see:

```
Welcome to Ubuntu...
root@ubuntu-s-1vcpu-1gb-sfo2-01:~#
```

---

## 🔧 Troubleshooting

### "Server refused our key"

1. **Check key format**: Make sure you added the **public key** (starts with `ssh-rsa`), not the private key
2. **Check permissions** on droplet:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```
3. **Verify key was added correctly**:
   ```bash
   cat ~/.ssh/authorized_keys
   ```

### "Permission denied (publickey)"

1. Make sure you're using the correct private key in PuTTY
2. Check that the public key matches the private key
3. Try regenerating the key pair

### "Connection timeout"

1. Check if port 22 is open in DigitalOcean firewall
2. Verify the IP address is correct: `143.110.198.38`
3. Check if the droplet is running

---

## 📝 Quick Reference

**PuTTY Settings:**
- Host: `143.110.198.38`
- Port: `22`
- Connection type: `SSH`
- Private key: `C:\path\to\tracsopro-key.ppk`

**PowerShell SSH:**
```powershell
ssh root@143.110.198.38
```

**DigitalOcean Console:**
- Click "Console" button in droplet page (no SSH key needed!)

---

## 🎯 Recommended Approach

**For now, use the DigitalOcean Console** (browser-based terminal):
- No SSH key setup needed
- Works immediately
- You can do all deployment steps there

**Later, set up SSH keys** for easier access via PuTTY or PowerShell.

---

**Once connected, proceed with the deployment steps from `DEPLOYMENT_GUIDE_PUTTY.md`!**




