-- Performance indexes and schema hardening
CREATE INDEX IF NOT EXISTS "Shift_scheduledStartTime_status_idx" ON "Shift"("scheduledStartTime", "status");
CREATE INDEX IF NOT EXISTS "Shift_guardId_status_scheduledStartTime_idx" ON "Shift"("guardId", "status", "scheduledStartTime");
CREATE INDEX IF NOT EXISTS "TrackingRecord_guardId_timestamp_idx" ON "TrackingRecord"("guardId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "RefreshToken_expiresAt_revokedAt_idx" ON "RefreshToken"("expiresAt", "revokedAt");
CREATE INDEX IF NOT EXISTS "BillingRecord_securityCompanyId_createdAt_idx" ON "BillingRecord"("securityCompanyId", "createdAt");
