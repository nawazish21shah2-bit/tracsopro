/** Shared Detox E2E credentials — must match backend/scripts/seed-e2e-user.ts defaults. */
module.exports = {
  email: process.env.E2E_GUARD_EMAIL || 'e2e-guard@tracsopro.e2e',
  password: process.env.E2E_GUARD_PASSWORD || 'E2eGuardPass123!',
  clientEmail: process.env.E2E_CLIENT_EMAIL || 'e2e-client@tracsopro.e2e',
  clientPassword: process.env.E2E_CLIENT_PASSWORD || 'E2eGuardPass123!',
  adminEmail: process.env.E2E_ADMIN_EMAIL || 'e2e-admin@tracsopro.e2e',
  adminPassword: process.env.E2E_ADMIN_PASSWORD || 'E2eGuardPass123!',
  /** Matches E2E site coordinates in seed-e2e-user.ts (Android emulator friendly). */
  siteLatitude: 37.422,
  siteLongitude: -122.084,
  e2eSiteName: 'E2E Check-In Site',
  e2eGuardName: 'E2E Guard',
};