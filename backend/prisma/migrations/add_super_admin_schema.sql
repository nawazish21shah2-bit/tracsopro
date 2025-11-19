-- Migration: Add Super Admin Multi-Tenant Architecture
-- This migration adds the Super Admin functionality and multi-tenant support

-- Add SUPER_ADMIN to Role enum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- Create SecurityCompany table
CREATE TABLE "SecurityCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'BASIC',
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "subscriptionStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionEndDate" TIMESTAMP(3),
    "maxGuards" INTEGER NOT NULL DEFAULT 10,
    "maxClients" INTEGER NOT NULL DEFAULT 5,
    "maxSites" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityCompany_pkey" PRIMARY KEY ("id")
);

-- Create enums for subscription management
CREATE TYPE "SubscriptionPlan" AS ENUM ('BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "CompanyRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'EMPLOYEE');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');
CREATE TYPE "BillingType" AS ENUM ('SUBSCRIPTION', 'OVERAGE', 'SETUP_FEE', 'PENALTY', 'REFUND');
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');
CREATE TYPE "SettingCategory" AS ENUM ('GENERAL', 'SECURITY', 'BILLING', 'NOTIFICATIONS', 'INTEGRATIONS', 'FEATURES');
CREATE TYPE "AnalyticsMetric" AS ENUM ('ACTIVE_GUARDS', 'ACTIVE_CLIENTS', 'ACTIVE_SITES', 'TOTAL_SHIFTS', 'COMPLETED_SHIFTS', 'INCIDENTS_REPORTED', 'REVENUE', 'SUBSCRIPTION_RENEWALS', 'USER_ENGAGEMENT', 'SYSTEM_PERFORMANCE');

-- Create CompanyUser junction table
CREATE TABLE "CompanyUser" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CompanyRole" NOT NULL DEFAULT 'EMPLOYEE',
    "permissions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyUser_pkey" PRIMARY KEY ("id")
);

-- Create CompanyGuard junction table
CREATE TABLE "CompanyGuard" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "department" TEXT,
    "salary" DOUBLE PRECISION,
    "hourlyRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyGuard_pkey" PRIMARY KEY ("id")
);

-- Create CompanyClient junction table
CREATE TABLE "CompanyClient" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "contractValue" DOUBLE PRECISION,
    "paymentTerms" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyClient_pkey" PRIMARY KEY ("id")
);

-- Create CompanySite junction table
CREATE TABLE "CompanySite" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "contractDetails" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySite_pkey" PRIMARY KEY ("id")
);

-- Create Subscription table
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "paymentMethod" TEXT,
    "stripeSubscriptionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- Create BillingRecord table
CREATE TABLE "BillingRecord" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "type" "BillingType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "invoiceNumber" TEXT,
    "stripeInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

-- Create PlatformSettings table
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" "SettingCategory" NOT NULL DEFAULT 'GENERAL',
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- Create PlatformAnalytics table
CREATE TABLE "PlatformAnalytics" (
    "id" TEXT NOT NULL,
    "securityCompanyId" TEXT,
    "metricType" "AnalyticsMetric" NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "dimensions" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAnalytics_pkey" PRIMARY KEY ("id")
);

-- Create SystemAuditLog table
CREATE TABLE "SystemAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "securityCompanyId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "SecurityCompany_registrationNumber_key" ON "SecurityCompany"("registrationNumber");
CREATE UNIQUE INDEX "SecurityCompany_email_key" ON "SecurityCompany"("email");
CREATE UNIQUE INDEX "CompanyUser_securityCompanyId_userId_key" ON "CompanyUser"("securityCompanyId", "userId");
CREATE UNIQUE INDEX "CompanyGuard_securityCompanyId_guardId_key" ON "CompanyGuard"("securityCompanyId", "guardId");
CREATE UNIQUE INDEX "CompanyClient_securityCompanyId_clientId_key" ON "CompanyClient"("securityCompanyId", "clientId");
CREATE UNIQUE INDEX "CompanySite_securityCompanyId_siteId_key" ON "CompanySite"("securityCompanyId", "siteId");
CREATE UNIQUE INDEX "BillingRecord_invoiceNumber_key" ON "BillingRecord"("invoiceNumber");
CREATE UNIQUE INDEX "PlatformSettings_securityCompanyId_key_key" ON "PlatformSettings"("securityCompanyId", "key");

-- Create indexes for performance
CREATE INDEX "SecurityCompany_email_idx" ON "SecurityCompany"("email");
CREATE INDEX "SecurityCompany_subscriptionStatus_idx" ON "SecurityCompany"("subscriptionStatus");
CREATE INDEX "SecurityCompany_isActive_idx" ON "SecurityCompany"("isActive");
CREATE INDEX "CompanyUser_securityCompanyId_idx" ON "CompanyUser"("securityCompanyId");
CREATE INDEX "CompanyUser_userId_idx" ON "CompanyUser"("userId");
CREATE INDEX "CompanyUser_role_idx" ON "CompanyUser"("role");
CREATE INDEX "CompanyGuard_securityCompanyId_idx" ON "CompanyGuard"("securityCompanyId");
CREATE INDEX "CompanyGuard_guardId_idx" ON "CompanyGuard"("guardId");
CREATE INDEX "CompanyClient_securityCompanyId_idx" ON "CompanyClient"("securityCompanyId");
CREATE INDEX "CompanyClient_clientId_idx" ON "CompanyClient"("clientId");
CREATE INDEX "CompanySite_securityCompanyId_idx" ON "CompanySite"("securityCompanyId");
CREATE INDEX "CompanySite_siteId_idx" ON "CompanySite"("siteId");
CREATE INDEX "Subscription_securityCompanyId_idx" ON "Subscription"("securityCompanyId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_endDate_idx" ON "Subscription"("endDate");
CREATE INDEX "BillingRecord_securityCompanyId_idx" ON "BillingRecord"("securityCompanyId");
CREATE INDEX "BillingRecord_status_idx" ON "BillingRecord"("status");
CREATE INDEX "BillingRecord_dueDate_idx" ON "BillingRecord"("dueDate");
CREATE INDEX "BillingRecord_invoiceNumber_idx" ON "BillingRecord"("invoiceNumber");
CREATE INDEX "PlatformSettings_securityCompanyId_idx" ON "PlatformSettings"("securityCompanyId");
CREATE INDEX "PlatformSettings_category_idx" ON "PlatformSettings"("category");
CREATE INDEX "PlatformSettings_isGlobal_idx" ON "PlatformSettings"("isGlobal");
CREATE INDEX "PlatformAnalytics_securityCompanyId_idx" ON "PlatformAnalytics"("securityCompanyId");
CREATE INDEX "PlatformAnalytics_metricType_idx" ON "PlatformAnalytics"("metricType");
CREATE INDEX "PlatformAnalytics_timestamp_idx" ON "PlatformAnalytics"("timestamp");
CREATE INDEX "SystemAuditLog_userId_idx" ON "SystemAuditLog"("userId");
CREATE INDEX "SystemAuditLog_securityCompanyId_idx" ON "SystemAuditLog"("securityCompanyId");
CREATE INDEX "SystemAuditLog_action_idx" ON "SystemAuditLog"("action");
CREATE INDEX "SystemAuditLog_resource_idx" ON "SystemAuditLog"("resource");
CREATE INDEX "SystemAuditLog_timestamp_idx" ON "SystemAuditLog"("timestamp");

-- Add foreign key constraints
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_securityCompanyId_fkey" FOREIGN KEY ("securityCompanyId") REFERENCES "SecurityCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyGuard" ADD CONSTRAINT "CompanyGuard_securityCompanyId_fkey" FOREIGN KEY ("securityCompanyId") REFERENCES "SecurityCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyGuard" ADD CONSTRAINT "CompanyGuard_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "Guard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyClient" ADD CONSTRAINT "CompanyClient_securityCompanyId_fkey" FOREIGN KEY ("securityCompanyId") REFERENCES "SecurityCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyClient" ADD CONSTRAINT "CompanyClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanySite" ADD CONSTRAINT "CompanySite_securityCompanyId_fkey" FOREIGN KEY ("securityCompanyId") REFERENCES "SecurityCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanySite" ADD CONSTRAINT "CompanySite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_securityCompanyId_fkey" FOREIGN KEY ("securityCompanyId") REFERENCES "SecurityCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingRecord" ADD CONSTRAINT "BillingRecord_securityCompanyId_fkey" FOREIGN KEY ("securityCompanyId") REFERENCES "SecurityCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformSettings" ADD CONSTRAINT "PlatformSettings_securityCompanyId_fkey" FOREIGN KEY ("securityCompanyId") REFERENCES "SecurityCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default Super Admin user (password should be changed immediately)
INSERT INTO "User" ("id", "email", "password", "firstName", "lastName", "role", "isActive", "isEmailVerified") 
VALUES (
    gen_random_uuid()::text,
    'superadmin@tracsopro.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
    'Super',
    'Admin',
    'SUPER_ADMIN',
    true,
    true
) ON CONFLICT (email) DO NOTHING;
