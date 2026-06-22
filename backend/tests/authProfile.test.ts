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

describe('Auth profile and password APIs', () => {
  const runId = `profile-${Date.now()}`;
  let tenant: TenantFixture;

  before(async () => {
    tenant = await createTenantFixture('profile', runId);
  });

  after(async () => {
    await destroyFixturesByRunId(runId);
  });

  it('guard updates profile via auth endpoint', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set(auth(tenant.guard.token))
      .send({
        firstName: 'Updated',
        lastName: 'GuardName',
        phone: '+15559876543',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data?.firstName, 'Updated');
  });

  it('guard reads profile settings', async () => {
    const res = await request(app)
      .get('/api/settings/profile')
      .set(auth(tenant.guard.token));

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data?.firstName, 'Updated');
  });

  it('forgot-password accepts registered email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: tenant.guard.email });

    assert.ok(res.status === 200 || res.status === 201);
    assert.equal(res.body.success, true);
  });

  it('maintenance status is publicly readable', async () => {
    const res = await request(app).get('/api/auth/maintenance-status');

    assert.equal(res.status, 200);
    assert.ok(typeof res.body.maintenanceMode === 'boolean' || res.body.success !== undefined);
  });
});
