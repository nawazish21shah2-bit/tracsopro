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

describe('Client extended portal APIs', () => {
  const runId = `client-ext-${Date.now()}`;
  let tenant: TenantFixture;
  const shiftIds: string[] = [];

  before(async () => {
    tenant = await createTenantFixture('clientext', runId);
    await enablePaidSubscription(tenant.companyId, runId);

    const shift = await prisma.shift.create({
      data: {
        guardId: tenant.guard.guardId,
        siteId: tenant.siteId,
        clientId: tenant.client.clientId,
        locationName: 'Client Ext Site',
        locationAddress: 'Main',
        scheduledStartTime: new Date(Date.now() - 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
      },
    });
    shiftIds.push(shift.id);
  });

  after(async () => {
    await prisma.shift.deleteMany({ where: { id: { in: shiftIds } } }).catch(() => {});
    await prisma.subscription.deleteMany({ where: { securityCompanyId: tenant.companyId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('client lists guards, reports, and notifications', async () => {
    const guards = await request(app)
      .get('/api/clients/my-guards')
      .set(auth(tenant.client.token));

    assert.equal(guards.status, 200);
    assert.equal(guards.body.success, true);

    const reports = await request(app)
      .get('/api/clients/my-reports')
      .set(auth(tenant.client.token));

    assert.equal(reports.status, 200);
    assert.equal(reports.body.success, true);

    const notifications = await request(app)
      .get('/api/clients/my-notifications')
      .set(auth(tenant.client.token));

    assert.equal(notifications.status, 200);
    assert.equal(notifications.body.success, true);
  });

  it('client views guard profile', async () => {
    const res = await request(app)
      .get(`/api/clients/guards/${tenant.guard.guardId}`)
      .set(auth(tenant.client.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('client creates a shift and responds to incident report', async () => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const end = new Date(Date.now() + 32 * 60 * 60 * 1000);

    const create = await request(app)
      .post('/api/clients/shifts')
      .set(auth(tenant.client.token))
      .send({
        siteId: tenant.siteId,
        guardId: tenant.guard.guardId,
        scheduledStartTime: start.toISOString(),
        scheduledEndTime: end.toISOString(),
        description: 'Client-created shift',
      });

    assert.equal(create.status, 201);
    assert.equal(create.body.success, true);
    shiftIds.push(create.body.data.id);

    const respond = await request(app)
      .put(`/api/clients/reports/${tenant.incidentReportId}/respond`)
      .set(auth(tenant.client.token))
      .send({
        status: 'REVIEWED',
        responseNotes: 'Acknowledged by client',
      });

    assert.equal(respond.status, 200);
    assert.equal(respond.body.success, true);
  });

  it('client updates own profile', async () => {
    const res = await request(app)
      .put('/api/clients/profile')
      .set(auth(tenant.client.token))
      .send({
        companyName: `Updated Co ${runId}`,
        companyRegistrationNumber: `REG-${runId}`,
        phone: '+15551234567',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
