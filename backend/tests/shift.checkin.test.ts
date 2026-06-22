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

describe('Shift check-in geofence', () => {
  const runId = `checkin-${Date.now()}`;
  let tenant: TenantFixture;
  let shiftId: string;

  before(async () => {
    tenant = await createTenantFixture('checkin', runId);

    await prisma.site.update({
      where: { id: tenant.siteId },
      data: {
        latitude: 40.7128,
        longitude: -74.006,
        radiusMeters: 100,
      },
    });

    const shift = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Check-in Site',
        locationAddress: tenant.siteId,
        scheduledStartTime: new Date(Date.now() - 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });
    shiftId = shift.id;
  });

  after(async () => {
    await prisma.shift.deleteMany({ where: { id: shiftId } });
    await destroyFixturesByRunId(runId);
  });

  it('allows check-in within site radius', async () => {
    const res = await request(app)
      .post(`/api/shifts/${shiftId}/check-in`)
      .set(auth(tenant.guard.token))
      .send({
        location: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('rejects check-in outside site radius', async () => {
    const shift2 = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Far check-in',
        locationAddress: 'Far',
        scheduledStartTime: new Date(Date.now() - 30 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });

    const res = await request(app)
      .post(`/api/shifts/${shift2.id}/check-in`)
      .set(auth(tenant.guard.token))
      .send({
        location: { latitude: 40.8, longitude: -74.1, accuracy: 10 },
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error || '', /Check-in denied/i);

    await prisma.shift.delete({ where: { id: shift2.id } });
  });
});
