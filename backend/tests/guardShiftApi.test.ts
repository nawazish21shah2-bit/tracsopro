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

describe('Guard shift and profile APIs', () => {
  const runId = `guard-api-${Date.now()}`;
  let tenant: TenantFixture;
  let shiftId: string;

  before(async () => {
    tenant = await createTenantFixture('guard-api', runId);

    const shift = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Today Site',
        locationAddress: 'Main',
        scheduledStartTime: new Date(Date.now() - 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });
    shiftId = shift.id;
  });

  after(async () => {
    await prisma.shift.deleteMany({ where: { id: shiftId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('returns today shifts for guard', async () => {
    const res = await request(app)
      .get('/api/shifts/today')
      .set(auth(tenant.guard.token));

    assert.equal(res.status, 200);
    const shifts = res.body.data || res.body.shifts || [];
    assert.ok(Array.isArray(shifts));
    assert.ok(shifts.some((s: { id: string }) => s.id === shiftId));
  });

  it('returns shift statistics for guard', async () => {
    const res = await request(app)
      .get('/api/shifts/statistics')
      .set(auth(tenant.guard.token));

    assert.equal(res.status, 200);
    assert.ok(res.body.data || res.body.stats);
  });

  it('guard updates profile', async () => {
    const res = await request(app)
      .put('/api/guards/profile')
      .set(auth(tenant.guard.token))
      .send({ experience: '5 years security experience' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('guard lists notifications', async () => {
    const res = await request(app)
      .get('/api/notifications?limit=10')
      .set(auth(tenant.guard.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
