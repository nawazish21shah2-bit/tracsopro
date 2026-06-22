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

describe('Admin shift scheduling', () => {
  const runId = `schedule-${Date.now()}`;
  let tenant: TenantFixture;
  const shiftIds: string[] = [];

  before(async () => {
    tenant = await createTenantFixture('schedule', runId);
  });

  after(async () => {
    await prisma.shift.deleteMany({ where: { id: { in: shiftIds } } });
    await destroyFixturesByRunId(runId);
  });

  it('creates a shift for a guard at a company site', async () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(17, 0, 0, 0);

    const res = await request(app)
      .post('/api/admin/shifts')
      .set(auth(tenant.admin.token))
      .send({
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        scheduledStartTime: start.toISOString(),
        scheduledEndTime: end.toISOString(),
        description: 'Day shift',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    shiftIds.push(res.body.data.id);
  });

  it('rejects overlapping shift for the same guard', async () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(14, 0, 0, 0);
    const end = new Date(start);
    end.setHours(22, 0, 0, 0);

    const res = await request(app)
      .post('/api/admin/shifts')
      .set(auth(tenant.admin.token))
      .send({
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        scheduledStartTime: start.toISOString(),
        scheduledEndTime: end.toISOString(),
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error || res.body.message || '', /overlapping shift/i);
  });

  it('returns 30-day schedule for admin', async () => {
    const res = await request(app)
      .get('/api/admin/shifts/schedule/30-days')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });
});
