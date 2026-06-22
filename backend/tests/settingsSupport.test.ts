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

describe('Settings and support APIs', () => {
  const runId = `settings-${Date.now()}`;
  let tenant: TenantFixture;
  let ticketId: string | undefined;

  before(async () => {
    tenant = await createTenantFixture('settings', runId);
  });

  after(async () => {
    if (ticketId) {
      await prisma.supportTicket.deleteMany({ where: { id: ticketId } }).catch(() => {});
    }
    await destroyFixturesByRunId(runId);
  });

  it('guard reads and updates notification settings', async () => {
    const getRes = await request(app)
      .get('/api/settings/notifications')
      .set(auth(tenant.guard.token));

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);

    const putRes = await request(app)
      .put('/api/settings/notifications')
      .set(auth(tenant.guard.token))
      .send({
        pushNotifications: true,
        emailNotifications: false,
        shiftReminders: true,
      });

    assert.equal(putRes.status, 200);
    assert.equal(putRes.body.success, true);
  });

  it('guard submits support ticket and lists tickets', async () => {
    const submit = await request(app)
      .post('/api/settings/support/contact')
      .set(auth(tenant.guard.token))
      .send({
        subject: 'Test support ticket',
        message: 'Need help with check-in',
        category: 'TECHNICAL',
      });

    assert.equal(submit.status, 200);
    ticketId = submit.body.data?.id;

    const list = await request(app)
      .get('/api/settings/support/tickets')
      .set(auth(tenant.guard.token));

    assert.equal(list.status, 200);
    assert.equal(list.body.success, true);

    if (ticketId) {
      const detail = await request(app)
        .get(`/api/settings/support/tickets/${ticketId}`)
        .set(auth(tenant.guard.token));

      assert.equal(detail.status, 200);
    }
  });

  it('client reads company settings and guard attendance history', async () => {
    const company = await request(app)
      .get('/api/settings/company')
      .set(auth(tenant.client.token));

    assert.equal(company.status, 200);
    assert.equal(company.body.success, true);

    const attendance = await request(app)
      .get('/api/settings/attendance-history')
      .set(auth(tenant.guard.token));

    assert.equal(attendance.status, 200);
    assert.equal(attendance.body.success, true);
  });
});
