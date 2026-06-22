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

describe('Admin dashboard and operations APIs', () => {
  const runId = `dashboard-${Date.now()}`;
  let tenant: TenantFixture;

  before(async () => {
    tenant = await createTenantFixture('dashboard', runId);
    await enablePaidSubscription(tenant.companyId, runId);

    await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Dashboard Site',
        locationAddress: 'Main',
        scheduledStartTime: new Date(Date.now() - 30 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
      },
    });
  });

  after(async () => {
    await prisma.shift.deleteMany({
      where: { guardId: tenant.guard.guardId, locationName: 'Dashboard Site' },
    }).catch(() => {});
    await prisma.subscription.deleteMany({ where: { securityCompanyId: tenant.companyId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('admin reads dashboard stats and activity', async () => {
    const stats = await request(app)
      .get('/api/admin/dashboard/stats')
      .set(auth(tenant.admin.token));

    assert.equal(stats.status, 200);
    assert.equal(stats.body.success, true);

    const activity = await request(app)
      .get('/api/admin/dashboard/activity?limit=5')
      .set(auth(tenant.admin.token));

    assert.equal(activity.status, 200);
    assert.equal(activity.body.success, true);
    assert.ok(Array.isArray(activity.body.data));
  });

  it('admin reads subscription info', async () => {
    const sub = await request(app)
      .get('/api/admin/subscription')
      .set(auth(tenant.admin.token));

    assert.equal(sub.status, 200);
    assert.equal(sub.body.success, true);
  });

  it('admin reads operations center metrics', async () => {
    const metrics = await request(app)
      .get('/api/admin/operations/metrics')
      .set(auth(tenant.admin.token));

    assert.equal(metrics.status, 200);
    assert.equal(metrics.body.success, true);

    const guards = await request(app)
      .get('/api/admin/operations/guards')
      .set(auth(tenant.admin.token));

    assert.equal(guards.status, 200);
    assert.equal(guards.body.success, true);

    const opsActivity = await request(app)
      .get('/api/admin/operations/activity')
      .set(auth(tenant.admin.token));

    assert.equal(opsActivity.status, 200);
    assert.equal(opsActivity.body.success, true);
  });

  it('admin lists clients and incident stats', async () => {
    const clients = await request(app)
      .get('/api/admin/clients')
      .set(auth(tenant.admin.token));

    assert.equal(clients.status, 200);
    assert.equal(clients.body.success, true);

    const stats = await request(app)
      .get('/api/incidents/stats')
      .set(auth(tenant.admin.token));

    assert.equal(stats.status, 200);
    assert.equal(stats.body.success, true);
  });
});
