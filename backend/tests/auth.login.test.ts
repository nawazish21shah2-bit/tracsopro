import './setup/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { AuthService } from '../src/services/authService.js';
import { signRefreshToken } from '../src/utils/jwt.js';

const authService = new AuthService();
const runId = `auth-login-${Date.now()}`;
const testEmail = `${runId}@test.local`;
const testPassword = 'TestPass123!';

describe('Auth login', () => {
  let userId: string;

  before(async () => {
    const hash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hash,
        firstName: 'Auth',
        lastName: 'Test',
        role: 'GUARD',
        isActive: true,
        isEmailVerified: true,
      },
    });
    userId = user.id;
  });

  after(async () => {
    await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrong-password' });
    assert.equal(res.status, 401);
  });

  it('rejects login with invalid body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'short' });
    assert.equal(res.status, 400);
  });

  it('allows login with unverified email and returns warning', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: false },
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.isEmailVerified, false);
    assert.ok(res.body.data.emailVerificationWarning);
    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  });

  it('logs in verified active user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.ok(res.body.data.refreshToken);
  });
});

describe('Auth refresh token rotation', () => {
  const email = `${runId}-refresh@test.local`;
  let userId: string;
  let refreshToken: string;
  let jti: string;

  before(async () => {
    const hash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        firstName: 'Refresh',
        lastName: 'Test',
        role: 'GUARD',
        isActive: true,
        isEmailVerified: true,
      },
    });
    userId = user.id;
    jti = uuid();
    refreshToken = signRefreshToken(userId, jti);
    await prisma.refreshToken.create({
      data: {
        userId,
        jti,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  });

  after(async () => {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email } });
  });

  it('rotates refresh token on use', async () => {
    const result = await authService.refreshToken(refreshToken);
    assert.ok(result.token);
    assert.ok(result.refreshToken);
    assert.notEqual(result.refreshToken, refreshToken);

    const oldRecord = await prisma.refreshToken.findUnique({ where: { jti } });
    assert.ok(oldRecord?.revokedAt);

    await assert.rejects(() => authService.refreshToken(refreshToken));
  });
});
