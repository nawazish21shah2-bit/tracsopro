-- Baseline Migration: Multi-Tenant Architecture
-- This migration represents the state of the database after add_super_admin_schema.sql was applied
-- All tables and enums already exist in the database, so this is a no-op migration
-- This migration is marked as applied to sync Prisma's migration history with the actual database state

-- Note: The following tables/enums already exist in the database:
-- - SecurityCompany, CompanyUser, CompanyGuard, CompanyClient, CompanySite
-- - Subscription, BillingRecord, PlatformSettings, PlatformAnalytics, SystemAuditLog
-- - All related enums: SubscriptionPlan, SubscriptionStatus, CompanyRole, etc.
-- - SUPER_ADMIN role added to Role enum

-- This is an empty migration because the schema already matches the database



