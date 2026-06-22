import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import {
  createTenantFixture,
  destroyFixturesByRunId,
  type TenantFixture,
} from './helpers/tenantFixtures.js';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('Tracking and operations API', () => {
  const runId = `tracking-${Date.now()}`;
  let tenant: TenantFixture;

  before(async () => {
    tenant = await createTenantFixture('tracking', runId);
  });

  after(async () => {
    await prisma.trackingRecord.deleteMany({
      where: { guardId: tenant.guard.guardId },
    }).catch(() => {});
    await prisma.geofenceEvent.deleteMany({
      where: { guardId: tenant.guard.guardId },
    }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('guard records location and admin reads latest position', async () => {
    const record = await request(app)
      .post('/api/tracking/location')
      .set(auth(tenant.guard.token))
      .send({
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 12,
        timestamp: Date.now(),
      });

    assert.equal(record.status, 201);

    const latest = await request(app)
      .get(`/api/tracking/${tenant.guard.guardId}/latest`)
      .set(auth(tenant.admin.token));

    assert.equal(latest.status, 200);
    assert.equal(latest.body.data.latitude, 40.7128);
  });

  it('admin fetches guard tracking history', async () => {
    const res = await request(app)
      .get(`/api/tracking/history/${tenant.guard.guardId}?limit=10`)
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
  });

  it('guard records geofence event', async () => {
    const res = await request(app)
      .post('/api/tracking/geofence-event')
      .set(auth(tenant.guard.token))
      .send({
        geofenceId: tenant.siteId,
        eventType: 'ENTER',
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });

    assert.equal(res.status, 201);
  });

  it('admin reads operations metrics and guard statuses', async () => {
    const metrics = await request(app)
      .get('/api/admin/operations/metrics')
      .set(auth(tenant.admin.token));

    assert.equal(metrics.status, 200);
    assert.equal(metrics.body.success, true);

    const guards = await request(app)
      .get('/api/admin/operations/guards')
      .set(auth(tenant.admin.token));

    assert.equal(guards.status, 200);
    assert.ok(guards.body.data);
  });

  it('admin lists company guards', async () => {
    const res = await request(app)
      .get('/api/guards?limit=20')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    const items = res.body.data?.items || [];
    assert.ok(items.some((g: { id: string }) => g.id === tenant.guard.guardId));
  });
});
