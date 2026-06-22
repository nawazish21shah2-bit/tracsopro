/**
 * Seeds a dedicated guard user for mobile Detox E2E runs.
 * Idempotent — safe to run before each E2E session.
 *
 * Credentials (override via env):
 *   E2E_GUARD_EMAIL    default: e2e-guard@tracsopro.e2e
 *   E2E_GUARD_PASSWORD default: E2eGuardPass123!
 *   E2E_CLIENT_EMAIL    default: e2e-client@tracsopro.e2e (same password)
 *   E2E_ADMIN_EMAIL     default: e2e-admin@tracsopro.e2e (same password)
 *
 * Also seeds a site + IN_PROGRESS shift (no check-in yet) for check-in E2E.
 * Site coordinates match GuardTrackingApp/e2e/env.js (37.422, -122.084).
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/database.js';

dotenv.config();

const E2E_EMAIL = process.env.E2E_GUARD_EMAIL || 'e2e-guard@tracsopro.e2e';
const E2E_PASSWORD = process.env.E2E_GUARD_PASSWORD || 'E2eGuardPass123!';
const E2E_ADMIN_EMAIL = 'e2e-admin@tracsopro.e2e';
const E2E_CLIENT_EMAIL = 'e2e-client@tracsopro.e2e';
const E2E_COMPANY_EMAIL = 'e2e-company@tracsopro.e2e';
const E2E_SITE_NAME = 'E2E Check-In Site';
const E2E_SITE_LAT = 37.422;
const E2E_SITE_LNG = -122.084;

async function seedE2eGuard() {
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);
  const adminPasswordHash = await bcrypt.hash(E2E_PASSWORD, 10);

  const company = await prisma.securityCompany.upsert({
    where: { email: E2E_COMPANY_EMAIL },
    update: { isActive: true },
    create: {
      name: 'E2E Security Co',
      email: E2E_COMPANY_EMAIL,
      subscriptionPlan: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      maxGuards: 50,
      maxClients: 20,
      maxSites: 30,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: E2E_ADMIN_EMAIL },
    update: { isActive: true, isEmailVerified: true, role: 'ADMIN' },
    create: {
      email: E2E_ADMIN_EMAIL,
      password: adminPasswordHash,
      firstName: 'E2E',
      lastName: 'Admin',
      role: 'ADMIN',
      accountType: 'COMPANY',
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.companyUser.upsert({
    where: {
      securityCompanyId_userId: {
        securityCompanyId: company.id,
        userId: adminUser.id,
      },
    },
    update: { isActive: true },
    create: {
      userId: adminUser.id,
      securityCompanyId: company.id,
      isActive: true,
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { email: E2E_CLIENT_EMAIL },
    update: { isActive: true, isEmailVerified: true, role: 'CLIENT' },
    create: {
      email: E2E_CLIENT_EMAIL,
      password: adminPasswordHash,
      firstName: 'E2E',
      lastName: 'Client',
      role: 'CLIENT',
      accountType: 'COMPANY',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      accountType: 'COMPANY',
      companyName: 'E2E Client Co',
    },
  });

  await prisma.companyClient.upsert({
    where: {
      securityCompanyId_clientId: {
        securityCompanyId: company.id,
        clientId: client.id,
      },
    },
    update: { isActive: true },
    create: {
      securityCompanyId: company.id,
      clientId: client.id,
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: E2E_EMAIL },
    update: {
      password: passwordHash,
      isActive: true,
      isEmailVerified: true,
      role: 'GUARD',
    },
    create: {
      email: E2E_EMAIL,
      password: passwordHash,
      firstName: 'E2E',
      lastName: 'Guard',
      role: 'GUARD',
      accountType: 'INDIVIDUAL',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const guard = await prisma.guard.upsert({
    where: { userId: user.id },
    update: { status: 'ACTIVE' },
    create: {
      userId: user.id,
      employeeId: 'E2E-001',
      department: 'Security',
      status: 'ACTIVE',
    },
  });

  await prisma.companyGuard.upsert({
    where: {
      securityCompanyId_guardId: {
        securityCompanyId: company.id,
        guardId: guard.id,
      },
    },
    update: { isActive: true },
    create: {
      securityCompanyId: company.id,
      guardId: guard.id,
      isActive: true,
    },
  });

  let site = await prisma.site.findFirst({
    where: { clientId: client.id, name: E2E_SITE_NAME },
  });

  if (site) {
    site = await prisma.site.update({
      where: { id: site.id },
      data: {
        latitude: E2E_SITE_LAT,
        longitude: E2E_SITE_LNG,
        radiusMeters: 500,
        address: '1600 E2E Test Ave',
      },
    });
  } else {
    site = await prisma.site.create({
      data: {
        clientId: client.id,
        name: E2E_SITE_NAME,
        address: '1600 E2E Test Ave',
        latitude: E2E_SITE_LAT,
        longitude: E2E_SITE_LNG,
        radiusMeters: 500,
      },
    });
  }

  await prisma.companySite.upsert({
    where: {
      securityCompanyId_siteId: {
        securityCompanyId: company.id,
        siteId: site.id,
      },
    },
    update: {},
    create: {
      securityCompanyId: company.id,
      siteId: site.id,
    },
  });

  // Remove prior E2E shifts so each run starts fresh (not already checked in)
  await prisma.shift.deleteMany({
    where: {
      guardId: guard.id,
      locationName: E2E_SITE_NAME,
    },
  });

  const start = new Date(Date.now() - 60 * 60 * 1000);
  const end = new Date(Date.now() + 6 * 60 * 60 * 1000);

  await prisma.shift.create({
    data: {
      guardId: guard.id,
      siteId: site.id,
      clientId: client.id,
      locationName: E2E_SITE_NAME,
      locationAddress: site.address,
      scheduledStartTime: start,
      scheduledEndTime: end,
      status: 'IN_PROGRESS',
      description: 'E2E Detox check-in shift',
    },
  });

  console.log(`E2E guard ready: ${E2E_EMAIL} (shift at ${E2E_SITE_NAME})`);
  console.log(`E2E client ready: ${E2E_CLIENT_EMAIL} (password: ${E2E_PASSWORD})`);
  console.log(`E2E admin ready: ${E2E_ADMIN_EMAIL} (password: ${E2E_PASSWORD})`);
}

seedE2eGuard()
  .catch((err) => {
    console.error('E2E seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
