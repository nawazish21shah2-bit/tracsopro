import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import {
  createTenantFixture,
  destroyFixturesByRunId,
  enablePaidSubscription,
  type TenantFixture,
} from './helpers/tenantFixtures.js';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Client portal APIs', () => {
  const runId = `client-${Date.now()}`;
  let tenant: TenantFixture;
  let shiftId: string;

  before(async () => {
    tenant = await createTenantFixture('client', runId);
    await enablePaidSubscription(tenant.companyId, runId);

    const shift = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Client Portal Site',
        locationAddress: 'Main',
        scheduledStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 10 * 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });
    shiftId = shift.id;
  });

  after(async () => {
    await prisma.shift.deleteMany({ where: { id: shiftId } }).catch(() => {});
    await prisma.subscription.deleteMany({ where: { securityCompanyId: tenant.companyId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('client reads profile and dashboard stats', async () => {
    const profile = await request(app)
      .get('/api/clients/my-profile')
      .set(auth(tenant.client.token));

    assert.equal(profile.status, 200);
    assert.equal(profile.body.success, true);

    const stats = await request(app)
      .get('/api/clients/dashboard/stats')
      .set(auth(tenant.client.token));

    assert.equal(stats.status, 200);
    assert.equal(stats.body.success, true);
  });

  it('client lists sites and shifts', async () => {
    const sites = await request(app)
      .get('/api/clients/my-sites')
      .set(auth(tenant.client.token));

    assert.equal(sites.status, 200);
    assert.ok(Array.isArray(sites.body.data?.sites) || Array.isArray(sites.body.data));

    const shifts = await request(app)
      .get('/api/clients/my-shifts')
      .set(auth(tenant.client.token));

    assert.equal(shifts.status, 200);
    assert.equal(shifts.body.success, true);
  });

  it('admin lists clients for company', async () => {
    const res = await request(app)
      .get('/api/clients?limit=20')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const items = res.body.data?.items || res.body.data?.clients || [];
    assert.ok(Array.isArray(items));
  });

  it('authenticated user reads /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set(auth(tenant.guard.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.data?.email, tenant.guard.email);
  });
});
