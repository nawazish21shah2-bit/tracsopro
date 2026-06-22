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

describe('Site management (client + admin)', () => {
  const runId = `sites-${Date.now()}`;
  let tenant: TenantFixture;
  let extraSiteId: string | undefined;
  const originalRadius = 100;

  before(async () => {
    tenant = await createTenantFixture('sites', runId);
    await enablePaidSubscription(tenant.companyId, runId);
  });

  after(async () => {
    await prisma.subscription.deleteMany({
      where: { securityCompanyId: tenant.companyId },
    }).catch(() => {});
    if (extraSiteId) {
      await prisma.companySite.deleteMany({ where: { siteId: extraSiteId } }).catch(() => {});
      await prisma.site.deleteMany({ where: { id: extraSiteId } }).catch(() => {});
    }
    await prisma.site.update({
      where: { id: tenant.siteId },
      data: { radiusMeters: originalRadius },
    }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('allows client to create a site with clamped radius', async () => {
    const res = await request(app)
      .post('/api/sites')
      .set(auth(tenant.client.token))
      .send({
        name: 'North Warehouse',
        address: '100 Industrial Blvd',
        latitude: 40.71,
        longitude: -74.0,
        radiusMeters: 5,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    extraSiteId = res.body.data.id;
    assert.equal(res.body.data.radiusMeters, 20);
  });

  it('lists client sites including fixture and new site', async () => {
    const res = await request(app)
      .get('/api/sites/my-sites')
      .set(auth(tenant.client.token));

    assert.equal(res.status, 200);
    const ids = (res.body.data?.sites || []).map((s: { id: string }) => s.id);
    assert.ok(ids.includes(tenant.siteId));
    assert.ok(extraSiteId && ids.includes(extraSiteId));
  });

  it('clamps radius on update via client API', async () => {
    const res = await request(app)
      .put(`/api/sites/${tenant.siteId}`)
      .set(auth(tenant.client.token))
      .send({ radiusMeters: 99999 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.radiusMeters, 2000);
  });

  it('allows admin to search company sites', async () => {
    const res = await request(app)
      .get('/api/admin/sites?search=Warehouse&limit=20')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    const sites = res.body.data?.sites || [];
    assert.ok(extraSiteId && sites.some((s: { id: string }) => s.id === extraSiteId));
  });

  it('allows client to delete extra site without active shifts', async () => {
    assert.ok(extraSiteId);
    const res = await request(app)
      .delete(`/api/sites/${extraSiteId}`)
      .set(auth(tenant.client.token));

    assert.equal(res.status, 200);
    extraSiteId = undefined;
  });
});
