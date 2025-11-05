# Complete Authentication Implementation Guide

## 🎯 Overview

This guide provides complete instructions for implementing the streamlined authentication flow for Guards and Clients/Supervisors with OTP verification.

---

## ✅ What's Been Completed

### **Frontend Updates**
1. ✅ **Button Component** - Consistent buttons with arrow icons across all screens
2. ✅ **Account Type Selection Screen** - Choose Individual or Company account
3. ✅ **OTP Verification Screen** - Simplified single input field with key icon
4. ✅ **All Auth Screens** - Updated with proper Ionicons and Button component
5. ✅ **Guard Profile Setup** - Experience, ID cards, certifications

### **Backend Updates**
1. ✅ **Database Schema** - Updated Prisma schema with:
   - User: `accountType`, `isEmailVerified`, `emailVerificationToken`, `emailVerificationExpiry`
   - Guard: `experience`, `profilePictureUrl`, `idCardFrontUrl`, `idCardBackUrl`, `certificationUrls`
   - New Client model for individual/company clients
   - New AccountType enum (INDIVIDUAL, COMPANY)
   - Updated Role enum with CLIENT

2. ✅ **OTP Service** - Complete email verification service with:
   - OTP generation
   - Email sending with HTML templates
   - OTP storage and verification
   - Expiry management
   - Password reset OTP

### **Documentation**
1. ✅ `STREAMLINED-AUTH-FLOW.md` - Complete flow specification
2. ✅ `AUTH-FLOW-UPDATES-SUMMARY.md` - Detailed changes summary
3. ✅ `CONSISTENT-BUTTON-IMPLEMENTATION.md` - Button component guide
4. ✅ `MIGRATION-GUIDE.md` - Database migration instructions
5. ✅ This complete implementation guide

---

## 🚀 Quick Start - Backend Setup

### **Step 1: Install Dependencies**
```bash
cd backend
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### **Step 2: Run Database Migration**
```bash
# Generate and apply migration
npx prisma migrate dev --name add_otp_and_client_support

# Generate Prisma Client
npx prisma generate
```

**OR** use the provided script:
```bash
cd backend
setup-otp.bat
```

### **Step 3: Configure Environment Variables**
Add to `backend/.env`:
```env
# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@tracsopro.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASS`

### **Step 4: Update Auth Controller**
The auth controller needs to be updated to use the OTP service. Key changes needed:

```typescript
// In authController.ts
import otpService from '../services/otpService';

// Update register endpoint
export const register = async (req, res) => {
  // ... create user ...
  
  // Generate and send OTP
  const otp = otpService.generateOTP();
  await otpService.storeOTP(user.id, otp);
  await otpService.sendOTPEmail(user.email, otp, user.firstName);
  
  // Return success (don't auto-login yet)
  res.status(201).json({
    success: true,
    data: {
      userId: user.id,
      email: user.email,
      message: 'Registration successful. Please verify your email.'
    }
  });
};

// Add verify-otp endpoint
export const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;
  
  const isValid = await otpService.verifyOTP(userId, otp);
  
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }
  
  // Generate auth tokens
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  
  res.json({
    success: true,
    data: { user, token, refreshToken }
  });
};

// Add resend-otp endpoint
export const resendOTP = async (req, res) => {
  const { userId } = req.body;
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const otp = otpService.generateOTP();
  await otpService.storeOTP(userId, otp);
  await otpService.sendOTPEmail(user.email, otp, user.firstName);
  
  res.json({
    success: true,
    message: 'OTP sent successfully'
  });
};
```

### **Step 5: Add New Routes**
Add to `backend/src/routes/auth.ts`:
```typescript
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/complete-profile/guard', authenticate, guardController.completeProfile);
router.post('/complete-profile/client', authenticate, clientController.completeProfile);
```

---

## 🎨 Frontend Setup

### **Step 1: Rebuild App with Icon Support**
```bash
cd GuardTrackingApp

# Link vector icons (if not done)
npx react-native-asset

# Clear cache
npx react-native start --reset-cache

# In new terminal
npx react-native run-android
```

### **Step 2: Update Navigation Types**
Update `src/types/index.ts`:
```typescript
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  AccountType: undefined;
  Register: { 
    accountType?: 'individual' | 'company';
    role?: 'GUARD' | 'CLIENT';
  };
  EmailVerification: { 
    userId: string;
    email: string;
    role: 'GUARD' | 'CLIENT' | 'SUPERVISOR';
    accountType?: 'individual' | 'company';
    isPasswordReset?: boolean;
  };
  ProfileSetup: { 
    userId: string;
    role: 'GUARD' | 'CLIENT';
    accountType?: 'individual' | 'company';
  };
  ForgotPassword: undefined;
  ResetPassword: { email: string; otp: string };
};
```

### **Step 3: Update Redux Store**
Update `src/store/slices/authSlice.ts`:
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tempUserId: string | null; // For OTP verification
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

// Add new actions
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ userId, otp }: { userId: string; otp: string }) => {
    const response = await api.post('/auth/verify-otp', { userId, otp });
    return response.data;
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (userId: string) => {
    const response = await api.post('/auth/resend-otp', { userId });
    return response.data;
  }
);
```

---

## 📱 User Flows

### **Guard Registration Flow**
```
1. User opens app
   ↓
2. Taps "Register" → Goes to RegisterScreen (role: GUARD)
   ↓
3. Enters: Full Name, Email, Password, Confirm Password
   ↓
4. Taps "Continue" → Backend creates user, sends OTP
   ↓
5. EmailVerificationScreen (receives userId, email, role: GUARD)
   ↓
6. Enters OTP → Backend verifies, returns auth tokens
   ↓
7. ProfileSetupScreen (Guard)
   - Add Picture
   - Select Experience
   - Upload ID Card Front/Back
   - Upload Certifications
   ↓
8. Taps "Submit" → Backend creates Guard profile
   ↓
9. Navigate to Guard Dashboard
```

### **Client Registration Flow**
```
1. User opens app
   ↓
2. Taps "Register" → Goes to AccountTypeScreen
   ↓
3. Selects "Individual" or "Company"
   ↓
4. RegisterScreen (role: CLIENT, accountType: selected)
   ↓
5. Enters: Full Name, Email, Password, Confirm Password
   ↓
6. Taps "Continue" → Backend creates user, sends OTP
   ↓
7. EmailVerificationScreen (receives userId, email, role: CLIENT, accountType)
   ↓
8. Enters OTP → Backend verifies, returns auth tokens
   ↓
9. ClientProfileSetupScreen (based on accountType)
   - Individual: Personal details
   - Company: Company details, registration number, etc.
   ↓
10. Taps "Submit" → Backend creates Client profile
    ↓
11. Navigate to Client Dashboard
```

---

## 🔧 Pending Implementation

### **Frontend Screens to Create**
1. **Separate Signup Screens**
   - `GuardSignUpScreen.tsx` - For guards only
   - `ClientSignUpScreen.tsx` - For clients only

2. **Profile Setup Screens**
   - `ClientProfileSetupScreen.tsx` - For individual clients
   - `CompanyProfileSetupScreen.tsx` - For company clients

### **Backend Controllers to Create**
1. **Guard Controller** (`src/controllers/guardController.ts`)
   ```typescript
   export const completeProfile = async (req, res) => {
     const { experience, profilePicture, idCardFront, idCardBack, certifications } = req.body;
     const userId = req.user.id;
     
     // Upload files to cloud storage
     // Create Guard profile
     // Return success
   };
   ```

2. **Client Controller** (`src/controllers/clientController.ts`)
   ```typescript
   export const completeProfile = async (req, res) => {
     const { accountType, companyName, address, etc } = req.body;
     const userId = req.user.id;
     
     // Create Client profile
     // Return success
   };
   ```

### **File Upload Service**
Set up file uploads using Multer + Cloud Storage (AWS S3, Cloudinary, etc.):
```typescript
// src/services/uploadService.ts
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';

export const uploadProfilePicture = async (file) => {
  // Upload to S3
  // Return URL
};

export const uploadDocument = async (file) => {
  // Upload to S3
  // Return URL
};
```

---

## 🧪 Testing Checklist

### **Backend**
- [ ] Database migration successful
- [ ] Prisma Client generated
- [ ] OTP emails sending correctly
- [ ] OTP verification working
- [ ] OTP expiry working
- [ ] Resend OTP working
- [ ] User registration with OTP
- [ ] Profile completion endpoints

### **Frontend**
- [ ] Icons displaying correctly
- [ ] Account type selection works
- [ ] OTP input accepts only numbers
- [ ] OTP verification successful
- [ ] Resend code functionality
- [ ] Navigation flows correctly
- [ ] Profile setup screens work
- [ ] File uploads working

### **Integration**
- [ ] End-to-end Guard registration
- [ ] End-to-end Client registration (Individual)
- [ ] End-to-end Client registration (Company)
- [ ] Password reset with OTP
- [ ] Email delivery
- [ ] Database records created correctly

---

## 📊 Database Schema Summary

```prisma
User {
  + accountType: AccountType?
  + isEmailVerified: Boolean
  + emailVerificationToken: String?
  + emailVerificationExpiry: DateTime?
  + client: Client?
}

Guard {
  + experience: String?
  + profilePictureUrl: String?
  + idCardFrontUrl: String?
  + idCardBackUrl: String?
  + certificationUrls: String[]
}

Client {
  id: String
  userId: String (unique)
  accountType: AccountType
  companyName: String?
  companyRegistrationNumber: String?
  taxId: String?
  address, city, state, zipCode, country: String?
  website: String?
}

enum AccountType {
  INDIVIDUAL
  COMPANY
}

enum Role {
  + CLIENT
}
```

---

## 🎯 Next Actions

### **Immediate (Do Now)**
1. Run `backend/setup-otp.bat` to install dependencies and migrate database
2. Configure email credentials in `.env`
3. Test OTP email sending
4. Rebuild React Native app to see updated screens

### **Short Term (This Week)**
1. Update auth controller with OTP endpoints
2. Create Guard and Client profile completion endpoints
3. Set up file upload service
4. Create separate signup screens for Guard/Client
5. Create client profile setup screens

### **Medium Term (Next Week)**
1. Implement file uploads for ID cards and certifications
2. Add profile picture upload
3. Complete end-to-end testing
4. Add error handling and validation
5. Update API documentation

---

## 📞 Support

If you encounter issues:
1. Check `MIGRATION-GUIDE.md` for database setup
2. Check `AUTH-FLOW-UPDATES-SUMMARY.md` for frontend changes
3. Verify email configuration in `.env`
4. Check Prisma Studio: `npx prisma studio`
5. Check backend logs for errors

---

## ✨ Summary

**Completed:**
- ✅ Frontend UI updates matching designs
- ✅ Consistent button component with arrows
- ✅ Account type selection screen
- ✅ Simplified OTP verification screen
- ✅ Database schema updates
- ✅ OTP service implementation
- ✅ Complete documentation

**Pending:**
- ⏳ Auth controller OTP integration
- ⏳ Profile completion endpoints
- ⏳ File upload service
- ⏳ Separate signup screens
- ⏳ Client profile setup screens
- ⏳ End-to-end testing

**Ready to Deploy:**
- Database schema
- OTP service
- Frontend screens
- Button component
- Icon integration

---

🚀 **You're now ready to complete the authentication flow implementation!**
