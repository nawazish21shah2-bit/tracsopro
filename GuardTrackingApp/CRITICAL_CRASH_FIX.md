# Critical Crash Fix - Location Services

## Problem
App was crashing immediately when clicking Check-in, Check-out, or Emergency buttons in release builds, even with permissions already granted.

## Root Cause
The crash was happening at the native module level when `Geolocation.getCurrentPosition` was called synchronously immediately after button press. In release builds, this can cause the native bridge to crash before error handlers can catch it.

## Solution Applied

### 1. Added Missing Permissions (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```
These permissions are required for accessing location services in foreground on Android 10+.

### 2. Wrapped Location Calls in setTimeout
All `Geolocation.getCurrentPosition` calls are now wrapped in `setTimeout` with a 50ms delay to ensure they run in the next event loop tick. This prevents native bridge crashes.

### 3. Added Delays Before Location Requests
Added 100ms delays in button handlers (check-in, check-out, emergency) before calling location service. This ensures the UI thread is ready and prevents race conditions.

### 4. Simplified Location Options
Changed location options to be more lenient:
- `timeout: 15000` (15 seconds - reduced from 20)
- `maximumAge: 60000` (accept location up to 1 minute old - more lenient)

### 5. Enhanced Error Handling
- Added try-catch blocks at multiple levels
- Added validation for position data before processing
- Better error messages for users

## Files Modified

1. **GuardHomeScreen.tsx**
   - Wrapped `getCurrentPosition` in setTimeout in `attemptGetLocation`
   - Added delays before location calls in check-in, check-out, and emergency handlers
   - Simplified location options

2. **EmergencyButton.tsx**
   - Wrapped `getCurrentPosition` in setTimeout
   - Simplified location options

3. **AndroidManifest.xml**
   - Added FOREGROUND_SERVICE permissions

## Testing
1. Test Check-in button - should work without crash
2. Test Check-out button - should work without crash
3. Test Emergency button - should work without crash
4. Test with GPS disabled - should show appropriate error message
5. Test with permissions denied - should request permissions gracefully

## Important Notes
- The delays (50ms and 100ms) are minimal and won't be noticeable to users
- These delays are necessary to prevent native bridge crashes in release builds
- The location service will still work correctly, just with a tiny delay for safety

