# Fly.io CLI Windows Setup Fix

The Fly.io CLI is installed but not in your PATH. Here's how to fix it:

---

## 🔧 Quick Fix

### Option 1: Use Full Path (Quick Test)

```powershell
C:\Users\Nawazish Shah\.fly\bin\flyctl.exe version
```

### Option 2: Add to PATH (Permanent Fix)

#### Step 1: Add to PATH

1. Press `Win + X` → Select **"System"**
2. Click **"Advanced system settings"**
3. Click **"Environment Variables"**
4. Under **"User variables"**, find **"Path"** → Click **"Edit"**
5. Click **"New"**
6. Add: `C:\Users\Nawazish Shah\.fly\bin`
7. Click **"OK"** on all windows

#### Step 2: Restart PowerShell

Close and reopen PowerShell, then test:
```powershell
flyctl version
```

---

## ✅ Verify Installation

After adding to PATH, test:

```powershell
flyctl version
flyctl --help
```

---

## 🚀 Now You Can Use Fly.io

Once `flyctl` works, proceed with:

### 1. Login
```powershell
flyctl auth login
```

### 2. Navigate to Backend
```powershell
cd C:\learnings\tracsopro\backend
```

### 3. Initialize
```powershell
flyctl launch
```

---

## 💡 Alternative: Create Alias (Optional)

If you want to use `fly` instead of `flyctl`:

```powershell
# Create alias in PowerShell profile
notepad $PROFILE
```

Add this line:
```powershell
Set-Alias -Name fly -Value flyctl
```

Save and reload:
```powershell
. $PROFILE
```

Now you can use `fly` instead of `flyctl`.

---

## 🎯 Quick Commands Reference

Once PATH is fixed, use:

```powershell
flyctl auth login      # Login
flyctl launch          # Initialize app
flyctl deploy          # Deploy
flyctl logs            # View logs
flyctl status          # Check status
flyctl secrets set KEY=value  # Set secrets
```

---

## ✅ Next Steps

1. Add Fly.io to PATH (see above)
2. Restart PowerShell
3. Test: `flyctl version`
4. Login: `flyctl auth login`
5. Continue with deployment!

Good luck! 🚀



