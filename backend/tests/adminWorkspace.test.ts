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

describe('Admin workspace APIs', () => {
  const runId = `workspace-${Date.now()}`;
  let tenant: TenantFixture;
  let invitationId: string | undefined;

  before(async () => {
    tenant = await createTenantFixture('workspace', runId);
    await enablePaidSubscription(tenant.companyId, runId);
  });

  after(async () => {
    if (invitationId) {
      await prisma.invitation.deleteMany({ where: { id: invitationId } }).catch(() => {});
    }
    await prisma.subscription.deleteMany({ where: { securityCompanyId: tenant.companyId } }).catch(() => {});
    await destroyFixturesByRunId(runId);
  });

  it('admin lists company users', async () => {
    const res = await request(app)
      .get('/api/admin/users?limit=20')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const users = res.body.data?.users || res.body.data || [];
    assert.ok(Array.isArray(users));
    assert.ok(users.length >= 1);
  });

  it('admin creates and lists client invitation', async () => {
    const create = await request(app)
      .post('/api/admin/invitations')
      .set(auth(tenant.admin.token))
      .send({
        role: 'CLIENT',
        email: `invite-${runId}@tenant-isolation.test`,
        expiresInDays: 7,
      });

    assert.equal(create.status, 201);
    invitationId = create.body.data.id;
    assert.match(create.body.data.invitationCode, /^INV-/);

    const list = await request(app)
      .get('/api/admin/invitations?role=CLIENT')
      .set(auth(tenant.admin.token));

    assert.equal(list.status, 200);
    assert.ok(list.body.data.some((inv: { id: string }) => inv.id === invitationId));
  });

  it('admin reads subscription overview', async () => {
    const res = await request(app)
      .get('/api/subscription/overview')
      .set(auth(tenant.admin.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.hasPaidSubscription, true);
    assert.ok(res.body.data.limits);
  });

  it('admin gets and updates notification settings', async () => {
    const getRes = await request(app)
      .get('/api/settings/notifications')
      .set(auth(tenant.admin.token));

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);

    const putRes = await request(app)
      .put('/api/settings/notifications')
      .set(auth(tenant.admin.token))
      .send({
        pushNotifications: true,
        shiftReminders: false,
      });

    assert.equal(putRes.status, 200);
    assert.equal(putRes.body.data.shiftReminders, false);
  });
});
