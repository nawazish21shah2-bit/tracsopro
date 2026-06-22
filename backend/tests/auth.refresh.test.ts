import './setup/env.js';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { signRefreshToken } from '../src/utils/jwt.js';

describe('Auth refresh HTTP', () => {
  const email = `refresh-http-${Date.now()}@test.local`;
  let userId: string;
  let refreshToken: string;
  const jti = uuid();

  before(async () => {
    const hash = await bcrypt.hash('TestPass123!', 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        firstName: 'Refresh',
        lastName: 'Http',
        role: 'GUARD',
        isActive: true,
        isEmailVerified: true,
      },
    });
    userId = user.id;
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

  it('POST /api/auth/refresh rotates tokens', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.ok(res.body.data.refreshToken);
    assert.notEqual(res.body.data.refreshToken, refreshToken);
  });

  it('POST /api/auth/refresh rejects reused token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    assert.equal(res.status, 401);
  });

  it('POST /api/auth/refresh validates body', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    assert.equal(res.status, 400);
  });
});
