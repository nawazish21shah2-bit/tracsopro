import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loginSchema,
  refreshTokenSchema,
  verifyOtpSchema,
  checkInSchema,
} from '../src/validators/authSchemas.js';

describe('authSchemas', () => {
  it('loginSchema accepts valid credentials', () => {
    const parsed = loginSchema.parse({
      email: 'user@example.com',
      password: 'password123',
    });
    assert.equal(parsed.email, 'user@example.com');
  });

  it('loginSchema rejects short password', () => {
    assert.throws(() =>
      loginSchema.parse({ email: 'user@example.com', password: 'short' })
    );
  });

  it('refreshTokenSchema requires token string', () => {
    assert.throws(() => refreshTokenSchema.parse({ refreshToken: '' }));
  });

  it('verifyOtpSchema validates uuid and 6-digit otp', () => {
    const parsed = verifyOtpSchema.parse({
      userId: '11111111-1111-1111-1111-111111111111',
      otp: '123456',
    });
    assert.equal(parsed.otp, '123456');
  });

  it('checkInSchema validates coordinates', () => {
    assert.throws(() =>
      checkInSchema.parse({
        shiftId: '11111111-1111-1111-1111-111111111111',
        latitude: 91,
        longitude: 0,
      })
    );
  });
});
