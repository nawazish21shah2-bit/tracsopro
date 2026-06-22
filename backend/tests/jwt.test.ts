import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { UnauthorizedError } from '../src/utils/errors.js';

describe('jwt utils', () => {
  let signAccessToken: (userId: string) => string;
  let signRefreshToken: (userId: string, jti: string) => string;
  let verifyToken: (token: string) => { sub: string; type?: string; jti?: string };
  let decodeToken: (token: string) => { sub: string } | null;
  let getTokenExpiresIn: () => number;
  let getRefreshTokenExpiresIn: () => number;

  before(async () => {
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-long';
    const jwtModule = await import('../src/utils/jwt.js');
    signAccessToken = jwtModule.signAccessToken;
    signRefreshToken = jwtModule.signRefreshToken;
    verifyToken = jwtModule.verifyToken;
    decodeToken = jwtModule.decodeToken;
    getTokenExpiresIn = jwtModule.getTokenExpiresIn;
    getRefreshTokenExpiresIn = jwtModule.getRefreshTokenExpiresIn;
  });

  const userId = '11111111-1111-1111-1111-111111111111';

  it('signAccessToken and verifyToken round-trip', () => {
    const token = signAccessToken(userId);
    const payload = verifyToken(token);
    assert.equal(payload.sub, userId);
    assert.equal(payload.type, 'access');
  });

  it('signRefreshToken includes jti', () => {
    const jti = 'refresh-jti-123';
    const token = signRefreshToken(userId, jti);
    const payload = verifyToken(token);
    assert.equal(payload.sub, userId);
    assert.equal(payload.type, 'refresh');
    assert.equal(payload.jti, jti);
  });

  it('verifyToken rejects tampered token', () => {
    const token = signAccessToken(userId);
    assert.throws(
      () => verifyToken(token.slice(0, -1) + 'x'),
      UnauthorizedError
    );
  });

  it('decodeToken returns payload without verifying expiry edge cases', () => {
    const token = signAccessToken(userId);
    const decoded = decodeToken(token);
    assert.equal(decoded?.sub, userId);
  });

  it('getTokenExpiresIn returns positive seconds for default 30m', () => {
    assert.ok(getTokenExpiresIn() >= 1800);
  });

  it('getRefreshTokenExpiresIn returns positive seconds for default 7d', () => {
    assert.ok(getRefreshTokenExpiresIn() >= 604800);
  });
});
