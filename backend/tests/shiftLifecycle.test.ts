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

const location = { latitude: 40.7128, longitude: -74.006, accuracy: 10 };

describe('Shift lifecycle (check-in, break, check-out)', () => {
  const runId = `lifecycle-${Date.now()}`;
  let tenant: TenantFixture;
  let shiftId: string;
  let breakId: string | undefined;

  before(async () => {
    tenant = await createTenantFixture('lifecycle', runId);

    await prisma.site.update({
      where: { id: tenant.siteId },
      data: { latitude: 40.7128, longitude: -74.006, radiusMeters: 500 },
    });

    const shift = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Lifecycle Site',
        locationAddress: 'Main',
        scheduledStartTime: new Date(Date.now() - 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: 'SCHEDULED',
      },
    });
    shiftId = shift.id;
  });

  after(async () => {
    await prisma.shiftBreak.deleteMany({ where: { shiftId } }).catch(() => {});
    await prisma.shift.deleteMany({ where: { id: shiftId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('completes check-in, break, and check-out', async () => {
    const checkIn = await request(app)
      .post(`/api/shifts/${shiftId}/check-in`)
      .set(auth(tenant.guard.token))
      .send({ location });

    assert.equal(checkIn.status, 200);
    assert.equal(checkIn.body.data.status, 'IN_PROGRESS');

    const startBreak = await request(app)
      .post(`/api/shifts/${shiftId}/start-break`)
      .set(auth(tenant.guard.token))
      .send({ breakType: 'REGULAR', location, notes: 'Short break' });

    assert.equal(startBreak.status, 201);
    breakId = startBreak.body.data.id;

    const activeBreak = await request(app)
      .get(`/api/shifts/${shiftId}/active-break`)
      .set(auth(tenant.guard.token));

    assert.equal(activeBreak.status, 200);
    assert.equal(activeBreak.body.data?.id, breakId);

    const endBreak = await request(app)
      .post(`/api/shifts/${shiftId}/end-break/${breakId}`)
      .set(auth(tenant.guard.token))
      .send({ location });

    assert.equal(endBreak.status, 200);

    const checkOut = await request(app)
      .post(`/api/shifts/${shiftId}/check-out`)
      .set(auth(tenant.guard.token))
      .send({ location, notes: 'Shift complete' });

    assert.equal(checkOut.status, 200);
    assert.equal(checkOut.body.data.status, 'COMPLETED');
  });
});
