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

describe('Shift incident report API', () => {
  const runId = `shift-inc-${Date.now()}`;
  let tenant: TenantFixture;
  let shiftId: string;

  before(async () => {
    tenant = await createTenantFixture('shiftinc', runId);

    const shift = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Incident Site',
        locationAddress: 'Main',
        scheduledStartTime: new Date(Date.now() - 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
      },
    });
    shiftId = shift.id;
  });

  after(async () => {
    await prisma.shift.deleteMany({ where: { id: shiftId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('guard reports incident on active shift', async () => {
    const res = await request(app)
      .post(`/api/shifts/${shiftId}/report-incident`)
      .set(auth(tenant.guard.token))
      .send({
        incidentType: 'SECURITY',
        severity: 'HIGH',
        title: 'Suspicious activity',
        description: 'Unknown person near gate',
        location: { latitude: 40.7128, longitude: -74.006 },
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data?.id);
  });

  it('guard reads shift statistics and weekly summary', async () => {
    const stats = await request(app)
      .get('/api/shifts/statistics')
      .set(auth(tenant.guard.token));

    assert.equal(stats.status, 200);
    assert.equal(stats.body.success, true);

    const summary = await request(app)
      .get('/api/shifts/weekly-summary')
      .set(auth(tenant.guard.token));

    assert.equal(summary.status, 200);
    assert.equal(summary.body.success, true);
  });
});
