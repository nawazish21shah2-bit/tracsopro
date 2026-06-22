import './setup/env.js';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import subscriptionService from '../src/services/subscriptionService.js';
import prisma from '../src/config/database.js';
import { TRIAL_LIMITS } from '../src/utils/planLimits.js';
import {
  createTenantFixture,
  destroyFixturesByRunId,
  type TenantFixture,
} from './helpers/tenantFixtures.js';

describe('Subscription trial limits', () => {
  const runId = `trial-${Date.now()}`;
  let tenant: TenantFixture;

  before(async () => {
    tenant = await createTenantFixture('trial', runId);
  });

  after(async () => {
    await destroyFixturesByRunId(runId);
  });

  it('applies trial limits when company has no paid subscription', async () => {
    const { limits, isTrial } = await subscriptionService.getEffectiveLimits(tenant.companyId);
    assert.equal(isTrial, true);
    assert.equal(limits.maxGuards, TRIAL_LIMITS.maxGuards);
  });

  it('blocks adding guards beyond trial limit', async () => {
    const extraGuardUsers = [];
    for (let i = 0; i < TRIAL_LIMITS.maxGuards; i++) {
      const email = `extra-guard-${i}-${runId}@tenant-isolation.test`;
      const user = await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash('TenantTestPass123!', 10),
          firstName: 'Extra',
          lastName: `Guard${i}`,
          role: 'GUARD',
          isActive: true,
          isEmailVerified: true,
        },
      });
      extraGuardUsers.push(user);
      const guard = await prisma.guard.create({
        data: { userId: user.id, employeeId: `EG-${runId}-${i}`, status: 'ACTIVE' },
      });
      await prisma.companyGuard.create({
        data: {
          securityCompanyId: tenant.companyId,
          guardId: guard.id,
          isActive: true,
        },
      });
    }

    const check = await subscriptionService.canAddGuard(tenant.companyId);
    assert.equal(check.allowed, false);
    assert.match(check.reason || '', /limit reached/i);

    for (const user of extraGuardUsers) {
      await prisma.companyGuard.deleteMany({ where: { guard: { userId: user.id } } });
      await prisma.guard.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
