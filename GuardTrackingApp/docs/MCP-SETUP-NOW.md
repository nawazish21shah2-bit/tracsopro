# ⚡ MCP Setup - Quick Action Guide

## ❌ Current Status: MCP NOT RUNNING

Your Figma MCP server is not currently configured or running. Let's fix this now!

## 🚀 Step-by-Step Setup (5 Minutes)

### Step 1: Open Figma Desktop (1 minute)

1. **Download Figma Desktop** (if you don't have it):
   - Go to: https://www.figma.com/downloads/
   - Download and install Figma Desktop
   - Sign in to your Figma account

2. **Open Figma Desktop App**
   - Make sure you're using the **Desktop App**, not the browser version
   - Open any Figma design file (or create a new one)

### Step 2: Enable Dev Mode & MCP Server (2 minutes)

1. **Enable Dev Mode**:
   - In Figma Desktop, press `Shift + D`
   - OR click the "Dev Mode" toggle in the top toolbar
   - You should see "Dev Mode" in the top bar

2. **Enable MCP Server**:
   - Look at the **right panel** (Inspect panel)
   - Find the section that says "MCP" or "Desktop MCP Server"
   - Click **"Enable desktop MCP server"** button
   - You should see a message: **"MCP server running at http://127.0.0.1:3845/mcp"**

3. **Keep Figma Desktop Open**:
   - The MCP server only works while Figma Desktop is running
   - Don't close Figma Desktop

### Step 3: Configure Cursor (2 minutes)

1. **Open Cursor Settings**:
   - Press `Ctrl + ,` (or `Cmd + ,` on Mac)
   - OR go to: `File` → `Preferences` → `Settings`

2. **Navigate to MCP Tab**:
   - In the settings search bar, type: `MCP`
   - Click on the **"MCP"** or **"Model Context Protocol"** section

3. **Add Figma MCP Server**:
   - Click **"Add Server"** or **"Add Custom MCP"** button
   - Fill in the following:
     ```
     Server Name: figma-desktop
     Server URL: http://127.0.0.1:3845/mcp
     Transport: HTTP
     ```
   - Click **Save**

4. **Restart Cursor**:
   - Close Cursor completely
   - Reopen Cursor
   - This is important for MCP to connect

### Step 4: Verify Setup

After restarting Cursor, the MCP server should be connected. You can verify by:

1. **Check MCP Status**:
   - The MCP server should appear in Cursor's MCP list
   - You should be able to access Figma resources

2. **Test Connection**:
   - Try asking me to access Figma resources
   - If it works, you'll see Figma files and designs

## 🔧 Troubleshooting

### Problem: "MCP server not found"

**Solution:**
- Make sure Figma Desktop is running (not browser)
- Ensure Dev Mode is enabled (`Shift + D`)
- Check that MCP server is enabled in the right panel
- Verify the URL is: `http://127.0.0.1:3845/mcp`

### Problem: "Connection refused"

**Solution:**
- Restart Figma Desktop
- Re-enable MCP server in Figma
- Restart Cursor
- Check if port 3845 is blocked by firewall

### Problem: "Can't find MCP settings in Cursor"

**Solution:**
- Make sure you're using the latest version of Cursor
- MCP might be in: `Settings` → `Features` → `MCP`
- Or: `Settings` → `Extensions` → `MCP`

### Problem: "MCP works but can't see Figma files"

**Solution:**
- Make sure you have a Figma file open in Figma Desktop
- The MCP server only works with open files
- Try opening a different Figma file

## ✅ Success Checklist

After setup, you should have:

- [ ] Figma Desktop installed and running
- [ ] Dev Mode enabled in Figma (`Shift + D`)
- [ ] MCP server enabled in Figma (shows URL)
- [ ] MCP server added in Cursor settings
- [ ] Cursor restarted
- [ ] MCP server appears in Cursor's MCP list

## 🎯 Next Steps

Once MCP is working:

1. **Extract Design Tokens** from Figma
2. **Sync Designs** with your codebase
3. **Update Screens** to match Figma designs

See `FIGMA-DESIGN-SYNC-GUIDE.md` for next steps.

## 📞 Still Having Issues?

If MCP still doesn't work:

1. **Check Figma Version**: Make sure you have the latest Figma Desktop
2. **Check Cursor Version**: Update Cursor to the latest version
3. **Alternative**: Use the remote MCP server at `https://mcp.figma.com/mcp`
4. **Manual Setup**: You can still update designs manually (see `FIGMA-DESIGN-SYNC-GUIDE.md`)

---

**Follow these steps and MCP will be running in 5 minutes!**












