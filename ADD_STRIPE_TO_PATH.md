# Add Stripe CLI to Windows PATH

## Quick Steps:

1. **Press `Win + R`**, type: `sysdm.cpl` and press Enter

2. **Click "Advanced" tab** → **"Environment Variables"**

3. **Under "System variables"** (bottom section):
   - Find and select **"Path"**
   - Click **"Edit"**

4. **Click "New"** and add:
   ```
   C:\stripe-cli
   ```

5. **Click "OK"** on all dialogs

6. **Close and reopen PowerShell** (important!)

7. **Test it**:
   ```powershell
   stripe --version
   ```

If you see a version number, it's working! ✅

---

## Alternative: Quick PowerShell Method

Run this in PowerShell as Administrator:

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\stripe-cli", [EnvironmentVariableTarget]::Machine)
```

Then restart PowerShell.

