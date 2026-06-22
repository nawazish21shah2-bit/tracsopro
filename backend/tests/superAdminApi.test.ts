import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { signAccessToken } from '../src/utils/jwt.js';

const TEST_DOMAIN = 'super-admin-api.test';

describe('Super Admin platform APIs', () => {
  const runId = `sa-${Date.now()}`;
  const email = `super-${runId}@${TEST_DOMAIN}`;
  let userId: string;
  let token: string;

  before(async () => {
    const passwordHash = await bcrypt.hash('SuperAdminTest123!', 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        accountType: 'COMPANY',
        isActive: true,
        isEmailVerified: true,
      },
    });
    userId = user.id;
    token = signAccessToken(userId);
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('reads platform overview and analytics', async () => {
    const overview = await request(app)
      .get('/api/super-admin/overview?period=30d')
      .set(auth());

    assert.equal(overview.status, 200);
    assert.equal(overview.body.success, true);

    const analytics = await request(app)
      .get('/api/super-admin/analytics?period=30d')
      .set(auth());

    assert.equal(analytics.status, 200);
    assert.equal(analytics.body.success, true);
  });

  it('lists companies and platform settings', async () => {
    const companies = await request(app)
      .get('/api/super-admin/companies?limit=10')
      .set(auth());

    assert.equal(companies.status, 200);
    assert.equal(companies.body.success, true);

    const settings = await request(app)
      .get('/api/super-admin/settings')
      .set(auth());

    assert.equal(settings.status, 200);
    assert.equal(settings.body.success, true);
  });

  it('lists audit logs and billing summary', async () => {
    const logs = await request(app)
      .get('/api/super-admin/audit-logs?limit=5')
      .set(auth());

    assert.equal(logs.status, 200);
    assert.equal(logs.body.success, true);

    const billing = await request(app)
      .get('/api/super-admin/billing')
      .set(auth());

    assert.equal(billing.status, 200);
    assert.equal(billing.body.success, true);
  });

  it('rejects non-super-admin access', async () => {
    const adminHash = await bcrypt.hash('AdminTest123!', 10);
    const admin = await prisma.user.create({
      data: {
        email: `admin-${runId}@${TEST_DOMAIN}`,
        password: adminHash,
        firstName: 'Regular',
        lastName: 'Admin',
        role: 'ADMIN',
        accountType: 'COMPANY',
        isActive: true,
        isEmailVerified: true,
      },
    });

    try {
      const res = await request(app)
        .get('/api/super-admin/overview')
        .set({ Authorization: `Bearer ${signAccessToken(admin.id)}` });

      assert.equal(res.status, 403);
    } finally {
      await prisma.user.deleteMany({ where: { id: admin.id } }).catch(() => {});
    }
  });
});
