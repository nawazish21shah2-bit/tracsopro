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

describe('Shift reports flow', () => {
  const runId = `reports-${Date.now()}`;
  let tenant: TenantFixture;
  let shiftId: string;
  let reportId: string | undefined;

  before(async () => {
    tenant = await createTenantFixture('reports', runId);

    await prisma.site.update({
      where: { id: tenant.siteId },
      data: { latitude: 40.7128, longitude: -74.006, radiusMeters: 500 },
    });

    const start = new Date(Date.now() - 30 * 60 * 1000);
    const end = new Date(Date.now() + 4 * 60 * 60 * 1000);

    const shift = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Report Site',
        locationAddress: 'Main',
        scheduledStartTime: start,
        scheduledEndTime: end,
        status: 'SCHEDULED',
      },
    });
    shiftId = shift.id;
  });

  after(async () => {
    if (reportId) {
      await prisma.shiftReport.deleteMany({ where: { id: reportId } }).catch(() => {});
    }
    await prisma.shift.deleteMany({ where: { id: shiftId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('guard checks in and submits a shift report', async () => {
    const checkIn = await request(app)
      .post(`/api/shifts/${shiftId}/check-in`)
      .set(auth(tenant.guard.token))
      .send({
        location: { latitude: 40.7128, longitude: -74.006, accuracy: 10 },
      });

    assert.equal(checkIn.status, 200);

    const create = await request(app)
      .post('/api/shift-reports')
      .set(auth(tenant.guard.token))
      .send({
        shiftId,
        content: 'Routine patrol completed. No issues observed.',
        reportType: 'SHIFT',
      });

    assert.equal(create.status, 201);
    reportId = create.body.report.id;

    const list = await request(app)
      .get('/api/shift-reports')
      .set(auth(tenant.guard.token));

    assert.equal(list.status, 200);
    assert.ok(Array.isArray(list.body));
    assert.ok(list.body.some((r: { id: string }) => r.id === reportId));
  });

  it('admin lists company shift reports', async () => {
    const res = await request(app)
      .get('/api/shift-reports/company?limit=20')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
  });
});
