# Profile Setup Screen - Icon Update

## Changes Made

### ✅ Submit Button
- **Before**: Text arrow character (→)
- **After**: Proper Ionicons `arrow-forward` icon
- **Color**: White (#FFFFFF)
- **Size**: 20px

### ✅ Upload Card Icons
Replaced emoji icons with proper Ionicons:

1. **ID Card Front/Back Upload**
   - **Before**: 🖼️ emoji
   - **After**: `image-outline` icon
   - **Color**: Gray (#6B7280)
   - **Size**: 24px

2. **Certification Upload**
   - **Before**: 📄 emoji
   - **After**: `document-outline` icon
   - **Color**: Gray (#6B7280)
   - **Size**: 24px

## Icon Summary

### Profile Setup Screen Icons:
- **Submit Button**: `arrow-forward` (white, 20px)
- **ID Card Upload**: `image-outline` (gray, 24px) - Used for both front and back
- **Certification Upload**: `document-outline` (gray, 24px)

## Consistency Across All Auth Screens

All authentication screens now use proper Ionicons:

### Login Screen
- `person` - Email field
- `lock-closed` - Password field
- `eye`/`eye-off` - Password visibility toggle

### Register Screen
- `person` - Full Name and Email fields
- `lock-closed` - Password fields
- `eye`/`eye-off` - Password visibility toggles

### Forgot Password Screen
- `mail` - Email field

### Reset Password Screen
- `lock-closed` - Password fields
- `eye`/`eye-off` - Password visibility toggles

### Profile Setup Screen
- `image-outline` - ID card uploads
- `document-outline` - Certification upload
- `arrow-forward` - Submit button

## File Modified
- `/GuardTrackingApp/src/screens/auth/ProfileSetupScreen.tsx`

## Next Steps
After rebuilding the app (using the previously provided commands), all icons will display properly across all authentication screens.

## Status
✅ All authentication screens updated with proper Ionicons
✅ Consistent design language across the app
✅ Ready for rebuild and testing
