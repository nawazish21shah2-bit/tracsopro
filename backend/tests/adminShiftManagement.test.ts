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

describe('Admin shift management APIs', () => {
  const runId = `admin-shifts-${Date.now()}`;
  let tenant: TenantFixture;
  let shiftId: string;
  let unassignedShiftId: string;

  before(async () => {
    tenant = await createTenantFixture('adminshifts', runId);
    await enablePaidSubscription(tenant.companyId, runId);

    const assigned = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Assigned Site',
        locationAddress: 'Main',
        scheduledStartTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 56 * 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });
    shiftId = assigned.id;

    const unassigned = await prisma.shift.create({
      data: {
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Unassigned Site',
        locationAddress: 'Main',
        scheduledStartTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 80 * 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });
    unassignedShiftId = unassigned.id;
  });

  after(async () => {
    await prisma.shift.deleteMany({
      where: { id: { in: [shiftId, unassignedShiftId] } },
    }).catch(() => {});
    await prisma.subscription.deleteMany({ where: { securityCompanyId: tenant.companyId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('admin lists shifts and unassigned shifts', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const list = await request(app)
      .get(`/api/admin/shifts?startDate=${today}&endDate=${end}`)
      .set(auth(tenant.admin.token));

    assert.equal(list.status, 200);
    assert.equal(list.body.success, true);

    const unassigned = await request(app)
      .get(`/api/admin/shifts/unassigned?startDate=${today}&endDate=${end}`)
      .set(auth(tenant.admin.token));

    assert.equal(unassigned.status, 200);
    assert.equal(unassigned.body.success, true);
  });

  it('admin reads 30-day schedule', async () => {
    const res = await request(app)
      .get('/api/admin/shifts/schedule/30-days')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('admin assigns guard, updates, and deletes shift', async () => {
    const assign = await request(app)
      .patch(`/api/admin/shifts/${unassignedShiftId}/assign-guard`)
      .set(auth(tenant.admin.token))
      .send({ guardId: tenant.guard.guardId });

    assert.equal(assign.status, 200);
    assert.equal(assign.body.success, true);

    const update = await request(app)
      .put(`/api/admin/shifts/${shiftId}`)
      .set(auth(tenant.admin.token))
      .send({ notes: 'Updated by admin test' });

    assert.equal(update.status, 200);
    assert.equal(update.body.success, true);

    const del = await request(app)
      .delete(`/api/admin/shifts/${shiftId}`)
      .set(auth(tenant.admin.token));

    assert.equal(del.status, 200);
    assert.equal(del.body.success, true);
    shiftId = '';
  });
});
