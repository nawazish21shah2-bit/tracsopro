# 🎨 Figma MCP Server Setup Guide

This guide will help you set up the Figma MCP (Model Context Protocol) server to integrate Figma designs with your Guard Tracking App development workflow.

## 📋 What is Figma MCP?

Figma MCP allows you to:
- Access Figma designs directly from Cursor
- Extract design tokens (colors, typography, spacing) from Figma
- Sync design specifications with your codebase
- Maintain consistency between design and implementation

## 🚀 Setup Methods

### Method 1: Desktop MCP Server (Recommended for Local Development)

#### Step 1: Enable Desktop MCP Server in Figma

1. **Open Figma Desktop App**
   - Make sure you have the latest version of Figma Desktop installed
   - Open your Figma design file

2. **Enable Dev Mode**
   - Click the "Dev Mode" toggle in the toolbar (or press `Shift + D`)
   - This switches Figma to developer mode

3. **Enable MCP Server**
   - In the right-hand inspect panel, look for "Enable desktop MCP server"
   - Click to enable it
   - You'll see a confirmation: "MCP server running at `http://127.0.0.1:3845/mcp`"

#### Step 2: Connect to Cursor Desktop

1. **Open Cursor Settings**
   - Go to `File` → `Preferences` → `Settings` (or `Ctrl + ,`)
   - Navigate to the **MCP** tab

2. **Add Figma MCP Server**
   - Click **"Add Custom MCP"** or **"Add Server"**
   - Enter the following:
     - **Server Name**: `figma-desktop`
     - **Server URL**: `http://127.0.0.1:3845/mcp`
     - **Transport Type**: `HTTP`
   - Click **Save**

3. **Verify Connection**
   - Restart Cursor Desktop
   - The MCP server should now be available

### Method 2: Remote MCP Server (For Cloud Access)

If you prefer not to use the desktop app:

1. **Add Remote Server**
   - In Cursor MCP settings, add:
     - **Server Name**: `figma-remote`
     - **Server URL**: `https://mcp.figma.com/mcp`
     - **Transport Type**: `HTTP`

2. **Authentication**
   - You may need to authenticate with Figma
   - Follow the prompts to connect your Figma account

## ✅ Verification

To verify the setup is working:

1. Open a Figma file in Figma Desktop
2. In Cursor, try accessing Figma resources using MCP commands
3. You should be able to see your Figma files and designs

## 🔧 Troubleshooting

### Issue: MCP Server Not Found

**Solution:**
- Make sure Figma Desktop is running
- Ensure Dev Mode is enabled (`Shift + D`)
- Check that the MCP server is enabled in the inspect panel
- Verify the URL is correct: `http://127.0.0.1:3845/mcp`

### Issue: Connection Refused

**Solution:**
- Restart Figma Desktop
- Restart Cursor Desktop
- Check if port 3845 is being used by another application
- Try disabling and re-enabling the MCP server in Figma

### Issue: Authentication Errors

**Solution:**
- Make sure you're logged into Figma Desktop
- Check your Figma account permissions
- Try logging out and back into Figma

## 📚 Next Steps

Once the MCP server is set up, you can:

1. **Extract Design Tokens** - Pull colors, typography, and spacing from Figma
2. **Sync Components** - Import component specifications
3. **Update Design System** - Keep your codebase design system in sync with Figma

See `FIGMA-DESIGN-SYNC-GUIDE.md` for detailed instructions on using Figma to update your UI designs.

## 🔗 Useful Links

- [Figma MCP Documentation](https://www.figma.com/developers/mcp)
- [Figma Desktop App Download](https://www.figma.com/downloads/)
- [Cursor MCP Documentation](https://docs.cursor.com)

---

**Note**: The desktop MCP server only works when Figma Desktop is running and Dev Mode is enabled. For continuous access, consider using the remote MCP server.













