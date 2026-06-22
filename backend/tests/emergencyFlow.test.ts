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

describe('Emergency alert flow', () => {
  const runId = `emergency-${Date.now()}`;
  let tenant: TenantFixture;
  let alertId: string | undefined;
  const extraLocationIds: string[] = [];

  before(async () => {
    tenant = await createTenantFixture('emergency', runId);
    // Fixture seeds a REPORTED incident that blocks new emergency alerts
    await prisma.incident.update({
      where: { id: tenant.incidentId },
      data: {
        status: 'CLOSED',
        resolvedAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });
  });

  after(async () => {
    if (alertId) {
      await prisma.incident.deleteMany({ where: { id: alertId } }).catch(() => {});
    }
    if (extraLocationIds.length) {
      await prisma.location.deleteMany({ where: { id: { in: extraLocationIds } } }).catch(() => {});
    }
    await destroyFixturesByRunId(runId);
  });

  it('guard triggers emergency and admin resolves it', async () => {
    const trigger = await request(app)
      .post('/api/emergency/alert')
      .set(auth(tenant.guard.token))
      .send({
        type: 'PANIC',
        severity: 'CRITICAL',
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
        },
        message: 'Test emergency alert',
      });

    assert.equal(trigger.status, 201);
    alertId = trigger.body.data.id;

    const active = await request(app)
      .get('/api/emergency/my-active')
      .set(auth(tenant.guard.token));

    assert.equal(active.status, 200);
    assert.equal(active.body.data?.id, alertId);

    const ack = await request(app)
      .post(`/api/emergency/alert/${alertId}/acknowledge`)
      .set(auth(tenant.admin.token));

    assert.equal(ack.status, 200);

    const resolve = await request(app)
      .post(`/api/emergency/alert/${alertId}/resolve`)
      .set(auth(tenant.admin.token))
      .send({ resolution: 'False alarm — test resolved' });

    assert.equal(resolve.status, 200);

    const stats = await request(app)
      .get('/api/emergency/statistics')
      .set(auth(tenant.admin.token));

    assert.equal(stats.status, 200);
    assert.equal(stats.body.success, true);
  });

  it('admin lists active emergency alerts', async () => {
    const res = await request(app)
      .get('/api/emergency/alerts/active')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
