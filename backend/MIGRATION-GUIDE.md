# Database Migration Guide

## Schema Updates

The Prisma schema has been updated with the following changes:

### **User Model Updates**
- Added `accountType` (INDIVIDUAL or COMPANY) for client users
- Added `isEmailVerified` to track email verification status
- Added `emailVerificationToken` for OTP storage
- Added `emailVerificationExpiry` for OTP expiration
- Added `client` relation

### **New Role**
- Added `CLIENT` to Role enum

### **New Enum**
- Added `AccountType` enum (INDIVIDUAL, COMPANY)

### **Guard Model Updates**
- Added `experience` field for years of experience
- Added `profilePictureUrl` for profile photo
- Added `idCardFrontUrl` for ID card front image
- Added `idCardBackUrl` for ID card back image
- Added `certificationUrls` array for certification documents

### **New Client Model**
- `id`: UUID primary key
- `userId`: Unique reference to User
- `accountType`: INDIVIDUAL or COMPANY
- `companyName`: Company name (for company accounts)
- `companyRegistrationNumber`: Company registration
- `taxId`: Tax ID number
- `address`, `city`, `state`, `zipCode`, `country`: Address fields
- `website`: Company website

## Running the Migration

### **Step 1: Generate Migration**
```bash
cd backend
npx prisma migrate dev --name add_otp_and_client_support
```

### **Step 2: Generate Prisma Client**
```bash
npx prisma generate
```

### **Step 3: Verify Migration**
```bash
npx prisma studio
```

## Migration SQL (Preview)

The migration will execute the following changes:

```sql
-- Add new enum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- Update Role enum
ALTER TYPE "Role" ADD VALUE 'CLIENT';

-- Add new columns to User table
ALTER TABLE "User" ADD COLUMN "accountType" "AccountType";
ALTER TABLE "User" ADD COLUMN "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpiry" TIMESTAMP(3);

-- Add new columns to Guard table
ALTER TABLE "Guard" ADD COLUMN "experience" TEXT;
ALTER TABLE "Guard" ADD COLUMN "profilePictureUrl" TEXT;
ALTER TABLE "Guard" ADD COLUMN "idCardFrontUrl" TEXT;
ALTER TABLE "Guard" ADD COLUMN "idCardBackUrl" TEXT;
ALTER TABLE "Guard" ADD COLUMN "certificationUrls" TEXT[];

-- Create Client table
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "companyName" TEXT,
    "companyRegistrationNumber" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- Create unique index
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- Create indexes
CREATE INDEX "Client_userId_idx" ON "Client"("userId");
CREATE INDEX "Client_accountType_idx" ON "Client"("accountType");

-- Add foreign key
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Rollback (if needed)

If you need to rollback this migration:

```bash
npx prisma migrate resolve --rolled-back add_otp_and_client_support
```

## Post-Migration Tasks

1. Update seed data if needed
2. Test user registration with new fields
3. Verify OTP functionality
4. Test client profile creation
5. Update API documentation

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@tracsopro.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

## Testing the Migration

```bash
# Run tests
npm test

# Check database
npx prisma studio

# Verify schema
npx prisma validate
```
