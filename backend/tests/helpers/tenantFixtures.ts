import bcrypt from 'bcryptjs';
import { IncidentReportStatus } from '@prisma/client';
import prisma from '../../src/config/database.js';
import { signAccessToken } from '../../src/utils/jwt.js';

export interface TenantFixture {
  runId: string;
  prefix: string;
  companyId: string;
  admin: { userId: string; token: string; email: string };
  guard: { userId: string; guardId: string; token: string; email: string };
  client: { userId: string; clientId: string; token: string; email: string };
  siteId: string;
  locationId: string;
  incidentReportId: string;
  incidentId: string;
}

const TEST_DOMAIN = 'tenant-isolation.test';

export async function createTenantFixture(prefix: string, runId: string): Promise<TenantFixture> {
  const passwordHash = await bcrypt.hash('TenantTestPass123!', 10);

  const company = await prisma.securityCompany.create({
    data: {
      name: `${prefix} Security Co ${runId}`,
      email: `${prefix}-company-${runId}@${TEST_DOMAIN}`,
      subscriptionPlan: 'BASIC',
      subscriptionStatus: 'ACTIVE',
      maxGuards: 50,
      maxClients: 20,
      maxSites: 30,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: `${prefix}-admin-${runId}@${TEST_DOMAIN}`,
      password: passwordHash,
      firstName: prefix,
      lastName: 'Admin',
      role: 'ADMIN',
      accountType: 'COMPANY',
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.companyUser.create({
    data: {
      securityCompanyId: company.id,
      userId: adminUser.id,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: `${prefix}-client-${runId}@${TEST_DOMAIN}`,
      password: passwordHash,
      firstName: prefix,
      lastName: 'Client',
      role: 'CLIENT',
      accountType: 'COMPANY',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const client = await prisma.client.create({
    data: {
      userId: clientUser.id,
      accountType: 'COMPANY',
      companyName: `${prefix} Client Co`,
    },
  });

  await prisma.companyClient.create({
    data: {
      securityCompanyId: company.id,
      clientId: client.id,
      isActive: true,
    },
  });

  const guardUser = await prisma.user.create({
    data: {
      email: `${prefix}-guard-${runId}@${TEST_DOMAIN}`,
      password: passwordHash,
      firstName: prefix,
      lastName: 'Guard',
      role: 'GUARD',
      accountType: 'INDIVIDUAL',
      isActive: true,
      isEmailVerified: true,
    },
  });

  const guard = await prisma.guard.create({
    data: {
      userId: guardUser.id,
      employeeId: `${prefix.toUpperCase()}-${runId}`,
      status: 'ACTIVE',
    },
  });

  await prisma.companyGuard.create({
    data: {
      securityCompanyId: company.id,
      guardId: guard.id,
      isActive: true,
    },
  });

  const site = await prisma.site.create({
    data: {
      clientId: client.id,
      name: `${prefix} Site ${runId}`,
      address: '100 Tenant Test Street',
    },
  });

  await prisma.companySite.create({
    data: {
      securityCompanyId: company.id,
      siteId: site.id,
    },
  });

  const incidentReport = await prisma.incidentReport.create({
    data: {
      guardId: guard.id,
      reportType: 'SAFETY',
      description: `${prefix} tenant isolation incident report`,
      status: IncidentReportStatus.SUBMITTED,
    },
  });

  const location = await prisma.location.create({
    data: {
      name: `${prefix} location`,
      address: '200 Tenant Test Avenue',
      latitude: 40.7128,
      longitude: -74.006,
      type: 'OUTDOOR',
    },
  });

  const incident = await prisma.incident.create({
    data: {
      reportedBy: guardUser.id,
      locationId: location.id,
      type: 'OTHER',
      severity: 'HIGH',
      title: `${prefix} incident`,
      description: `${prefix} tenant isolation incident`,
      status: 'REPORTED',
    },
  });

  return {
    runId,
    prefix,
    companyId: company.id,
    admin: {
      userId: adminUser.id,
      email: adminUser.email,
      token: signAccessToken(adminUser.id),
    },
    guard: {
      userId: guardUser.id,
      guardId: guard.id,
      email: guardUser.email,
      token: signAccessToken(guardUser.id),
    },
    client: {
      userId: clientUser.id,
      clientId: client.id,
      email: clientUser.email,
      token: signAccessToken(clientUser.id),
    },
    siteId: site.id,
    locationId: location.id,
    incidentReportId: incidentReport.id,
    incidentId: incident.id,
  };
}

export async function enablePaidSubscription(companyId: string, runId: string): Promise<void> {
  await prisma.subscription.create({
    data: {
      securityCompanyId: companyId,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      isActive: true,
      stripeSubscriptionId: `sub_test_${runId}`,
      amount: 99,
      billingCycle: 'MONTHLY',
      startDate: new Date(),
    },
  });
  await prisma.securityCompany.update({
    where: { id: companyId },
    data: {
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      maxGuards: 50,
      maxClients: 20,
      maxSites: 50,
    },
  });
}

export async function destroyTenantFixture(fixture: TenantFixture): Promise<void> {
  await prisma.incidentReportMedia.deleteMany({
    where: { incidentReportId: fixture.incidentReportId },
  });
  await prisma.incidentReport.deleteMany({ where: { id: fixture.incidentReportId } });
  await prisma.evidence.deleteMany({ where: { incidentId: fixture.incidentId } });
  await prisma.incident.deleteMany({ where: { id: fixture.incidentId } });
  await prisma.location.deleteMany({ where: { id: fixture.locationId } });
  await prisma.shift.deleteMany({ where: { siteId: fixture.siteId } });
  await prisma.companySite.deleteMany({ where: { siteId: fixture.siteId } });
  await prisma.site.deleteMany({ where: { id: fixture.siteId } });
  await prisma.companyGuard.deleteMany({ where: { guardId: fixture.guard.guardId } });
  await prisma.companyClient.deleteMany({ where: { clientId: fixture.client.clientId } });
  await prisma.companyUser.deleteMany({ where: { userId: fixture.admin.userId } });
  await prisma.guard.deleteMany({ where: { id: fixture.guard.guardId } });
  await prisma.client.deleteMany({ where: { id: fixture.client.clientId } });
  await prisma.user.deleteMany({
    where: {
      id: { in: [fixture.admin.userId, fixture.guard.userId, fixture.client.userId] },
    },
  });
  await prisma.securityCompany.deleteMany({ where: { id: fixture.companyId } });
}

export async function destroyFixturesByRunId(runId: string): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { contains: runId } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  if (userIds.length === 0) return;

  const guards = await prisma.guard.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const guardIds = guards.map((g) => g.id);

  const clients = await prisma.client.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const clientIds = clients.map((c) => c.id);

  const companies = await prisma.securityCompany.findMany({
    where: { email: { contains: runId } },
    select: { id: true },
  });
  const companyIds = companies.map((c) => c.id);

  await prisma.incidentReportMedia.deleteMany({
    where: { incidentReport: { guardId: { in: guardIds } } },
  });
  await prisma.incidentReport.deleteMany({ where: { guardId: { in: guardIds } } });
  await prisma.incident.deleteMany({ where: { reportedBy: { in: userIds } } });
  await prisma.evidence.deleteMany({
    where: { incident: { reportedBy: { in: userIds } } },
  });
  await prisma.location.deleteMany({
    where: { incidents: { some: { reportedBy: { in: userIds } } } },
  });

  const sites = await prisma.site.findMany({
    where: { clientId: { in: clientIds } },
    select: { id: true },
  });
  const siteIds = sites.map((s) => s.id);

  await prisma.shift.deleteMany({ where: { siteId: { in: siteIds } } });
  await prisma.companySite.deleteMany({ where: { siteId: { in: siteIds } } });
  await prisma.site.deleteMany({ where: { id: { in: siteIds } } });
  await prisma.companyGuard.deleteMany({
    where: { OR: [{ guardId: { in: guardIds } }, { securityCompanyId: { in: companyIds } }] },
  });
  await prisma.companyClient.deleteMany({
    where: { OR: [{ clientId: { in: clientIds } }, { securityCompanyId: { in: companyIds } }] },
  });
  await prisma.companyUser.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { securityCompanyId: { in: companyIds } }] },
  });
  await prisma.guard.deleteMany({ where: { id: { in: guardIds } } });
  await prisma.client.deleteMany({ where: { id: { in: clientIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.securityCompany.deleteMany({ where: { id: { in: companyIds } } });
}
