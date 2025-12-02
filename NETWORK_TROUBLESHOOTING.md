# Network Troubleshooting Guide

## Problem: "Network error. Please check your connection"

This error means your mobile app cannot reach the backend server. Follow these steps:

## Step 1: Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Backend running on http://0.0.0.0:3000
```

**Important**: The server must be running before you try to use the app!

## Step 2: Find Your Local IP Address

### Windows:
1. Open PowerShell or Command Prompt
2. Run: `ipconfig`
3. Look for "IPv4 Address" under your active network adapter
   - Usually under "Wireless LAN adapter Wi-Fi" or "Ethernet adapter"
   - Example: `192.168.1.12` or `192.168.0.105`

### Mac:
1. Open Terminal
2. Run: `ifconfig | grep "inet "`
3. Look for an IP starting with `192.168.` or `10.`
   - Usually `192.168.1.x` or `192.168.0.x`

### Linux:
1. Open Terminal
2. Run: `ip addr` or `ifconfig`
3. Look for `inet` address under your network interface

## Step 3: Update the IP in the Mobile App

1. Open: `GuardTrackingApp/src/services/api.ts`
2. Find line 31: `const LOCAL_IP = '192.168.1.12';`
3. Replace `192.168.1.12` with your actual IP address from Step 2
4. Save the file
5. Reload the app (shake device → Reload, or restart Metro bundler)

## Step 4: Verify Connectivity

### Test from Browser:
Open your browser and go to:
```
http://YOUR_IP:3000/api/health
```

If you see a response, the server is reachable!

### Test from Mobile App:
1. Make sure your phone/emulator is on the **same WiFi network** as your computer
2. Try logging in again
3. Check the console logs - you should see the baseURL in error messages

## Common Issues

### Issue: "Network Error" persists

**Solution 1: Check Firewall**
- Windows: Allow Node.js through Windows Firewall
- Mac: System Preferences → Security → Firewall → Allow Node.js

**Solution 2: Verify Server is Listening on 0.0.0.0**
- Check `backend/src/server.ts` line 257
- Should be: `app.listen(PORT, '0.0.0.0', ...)`
- NOT: `app.listen(PORT, ...)` (only localhost)

**Solution 3: Check Network**
- Phone and computer must be on the same WiFi network
- Some corporate networks block device-to-device communication
- Try using a mobile hotspot if on a restricted network

### Issue: Android Emulator can't connect

**Solution**: Use `10.0.2.2` instead of your local IP
- This is a special IP that Android emulator uses to reach the host machine
- Update `LOCAL_IP` in `api.ts` to `'10.0.2.2'`

### Issue: iOS Simulator can't connect

**Solution**: Use `localhost` or `127.0.0.1`
- iOS Simulator runs on the same machine, so use:
- `const LOCAL_IP = 'localhost';` or `'127.0.0.1';`

## Quick Test Commands

### Check if server is running:
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

### Test API from command line:
```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://YOUR_IP:3000/api/health"

# Mac/Linux
curl http://YOUR_IP:3000/api/health
```

## Current Configuration

- **Backend Port**: 3000
- **API Base URL**: `http://YOUR_IP:3000/api`
- **Server Listens On**: `0.0.0.0` (all network interfaces)

## Still Having Issues?

1. Check backend console for errors
2. Check mobile app console for detailed error messages
3. Verify IP address is correct (it can change if you reconnect to WiFi)
4. Try restarting both backend server and mobile app
5. Check that port 3000 is not blocked by firewall

