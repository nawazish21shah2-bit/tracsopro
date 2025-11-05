# Streamlined Authentication Flow - Implementation Plan

## Overview
Complete authentication flow for Guards and Clients/Supervisors with proper frontend-to-backend-to-database integration.

## User Flows

### **Guard Flow**
```
1. Sign Up Screen (Guard) → Enter details
2. OTP Verification → Verify email
3. Guard Profile Setup → Experience, ID, Certifications
4. Dashboard
```

### **Client/Supervisor Flow**
```
1. Account Type Selection → Individual or Company
2. Sign Up Screen (Client) → Enter details
3. OTP Verification → Verify email
4. Client Profile Setup → Based on account type
   - Individual: Personal details
   - Company: Company details, registration
5. Dashboard
```

## Screens to Create/Update

### **New Screens Needed**
1. ✅ `AccountTypeSelectionScreen` - Choose Individual/Company (Image 5)
2. 🔄 `ClientSignUpScreen` - Client registration (Images 2, 4)
3. 🔄 `OTPVerificationScreen` - Updated design (Image 3)
4. 🆕 `ClientProfileSetupScreen` - For Individual clients
5. 🆕 `CompanyProfileSetupScreen` - For Company clients
6. ✅ `GuardProfileSetupScreen` - Guard profile (Image 1)

### **Existing Screens to Update**
1. `RegisterScreen` - Currently generic, needs role-specific logic
2. `EmailVerificationScreen` - Update to match new UI (Image 3)
3. `ProfileSetupScreen` - Currently Guard-only, needs to route by role

## Database Schema Updates

### **Add to User Model**
```prisma
model User {
  // ... existing fields
  accountType   AccountType?  // For clients
  isEmailVerified Boolean @default(false)
  emailVerificationToken String?
  emailVerificationExpiry DateTime?
}

enum AccountType {
  INDIVIDUAL
  COMPANY
}
```

### **Add Client/Company Models**
```prisma
model Client {
  id          String      @id @default(uuid())
  userId      String      @unique
  accountType AccountType
  companyName String?     // For company accounts
  companyReg  String?     // Company registration number
  taxId       String?     // Tax ID
  address     String?
  city        String?
  state       String?
  zipCode     String?
  country     String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### **Update Guard Model**
```prisma
model Guard {
  // ... existing fields
  experience      String?     // Years of experience
  idCardFrontUrl  String?     // ID card front image
  idCardBackUrl   String?     // ID card back image
  certificationUrls String[]  // Certification documents
}
```

## API Endpoints to Create/Update

### **Authentication Endpoints**
```
POST /api/auth/register
- Add accountType parameter
- Add role parameter (GUARD, SUPERVISOR, ADMIN)
- Send OTP email
- Return user + temp token

POST /api/auth/verify-otp
- Verify OTP code
- Mark email as verified
- Return full auth token

POST /api/auth/resend-otp
- Resend OTP to email

POST /api/auth/complete-profile/guard
- Upload experience, ID cards, certifications
- Create Guard profile

POST /api/auth/complete-profile/client
- Create Client profile (individual or company)
- Upload relevant documents
```

## Frontend Implementation

### **Navigation Flow**
```typescript
AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  
  // Client Flow
  AccountTypeSelection: undefined;
  ClientSignUp: { accountType: 'individual' | 'company' };
  
  // Guard Flow
  GuardSignUp: undefined;
  
  // Common
  OTPVerification: { 
    email: string; 
    role: 'GUARD' | 'SUPERVISOR' | 'ADMIN';
    accountType?: 'individual' | 'company';
  };
  
  // Profile Setup
  GuardProfileSetup: { userId: string };
  ClientProfileSetup: { 
    userId: string; 
    accountType: 'individual' | 'company' 
  };
  
  // Password Reset
  ForgotPassword: undefined;
  ResetPassword: { email: string; otp: string };
}
```

### **State Management**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  tempToken: string | null; // For OTP verification
  isEmailVerified: boolean;
  profileCompleted: boolean;
  role: 'GUARD' | 'SUPERVISOR' | 'ADMIN' | null;
  accountType: 'individual' | 'company' | null;
}
```

## UI Components Matching Designs

### **Sign Up Screen** (Images 2, 4)
- Logo at top
- "SIGN UP" title
- Input fields with icons:
  - Full Name (person icon)
  - Email Address (person icon)
  - Password (lock icon + eye toggle)
  - Confirm Password (lock icon + eye toggle)
- "Continue" button with arrow
- "Already have an account? Login" footer

### **OTP Verification** (Image 3)
- Logo at top
- "VERIFY EMAIL" title
- Subtitle: "We have sent an OTP code to your email. Please check your email"
- Single OTP input field (not 5 boxes)
- "Did not receive code? Resend Code" link
- "Verify" button with arrow

### **Account Selection** (Image 5)
- Logo at top
- "SELECT ACCOUNT" title
- Subtitle: "Please select the account type that is relevant to your need."
- Two cards:
  - Individual Account (person icon)
  - Company Account (people icon)
- "Continue" button with arrow
- "Already have an account? Login" footer

### **Guard Profile Setup** (Image 1)
- Logo at top
- "SET UP YOUR PROFILE" title
- Add Picture (camera icon)
- Add Experience dropdown
- ID Verification:
  - Upload ID Card Front Image
  - Upload ID Card Back Image
- Certification:
  - Upload certification documents
- "Submit" button with arrow

## Implementation Steps

### **Phase 1: Database & Backend**
1. Update Prisma schema
2. Run migrations
3. Create OTP service (email sending)
4. Update auth controller
5. Create profile setup endpoints
6. Add file upload service

### **Phase 2: Frontend Screens**
1. Update AccountTypeScreen to match Image 5
2. Create separate GuardSignUpScreen
3. Create ClientSignUpScreen
4. Update OTPVerificationScreen to match Image 3
5. Update GuardProfileSetupScreen to match Image 1
6. Create ClientProfileSetupScreen
7. Create CompanyProfileSetupScreen

### **Phase 3: Integration**
1. Connect screens to Redux
2. Implement API calls
3. Add form validation
4. Add loading states
5. Add error handling
6. Test complete flows

### **Phase 4: Testing**
1. Test Guard registration flow
2. Test Individual client flow
3. Test Company client flow
4. Test OTP verification
5. Test profile completion
6. Test error scenarios

## Security Considerations
- OTP expires after 10 minutes
- Rate limit OTP requests
- Validate file uploads (size, type)
- Sanitize all inputs
- Use HTTPS for file uploads
- Store files securely (S3/Cloud Storage)

## File Upload Strategy
- Use multipart/form-data
- Store in cloud storage (AWS S3 or similar)
- Generate signed URLs for access
- Validate file types (images, PDFs)
- Limit file sizes (5MB for images, 10MB for documents)

## Next Actions
1. Update database schema
2. Create OTP email service
3. Update backend API endpoints
4. Create/update frontend screens
5. Test end-to-end flows
