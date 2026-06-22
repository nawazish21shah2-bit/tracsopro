import './setup/env.js';

import { describe, it } from 'node:test';

import assert from 'node:assert/strict';

import { generateOTP, getOTPExpiry, checkRateLimit } from '../src/services/otpService.js';

import { resetMemoryCache } from '../src/utils/cache.js';



describe('OTP service', () => {

  it('generates OTP of configured length', () => {

    const otp = generateOTP();

    assert.match(otp, /^\d{6}$/);

  });



  it('sets expiry within configured window', () => {

    const expiry = getOTPExpiry();

    const diffMinutes = (expiry.getTime() - Date.now()) / 60000;

    assert.ok(diffMinutes >= 9 && diffMinutes <= 11);

  });



  it('enforces rate limit after max attempts', async () => {

    resetMemoryCache();

    const id = `rate-test-${Date.now()}@test.local`;

    assert.equal(await checkRateLimit(id, 'email'), true);

    assert.equal(await checkRateLimit(id, 'email'), true);

    assert.equal(await checkRateLimit(id, 'email'), true);

    assert.equal(await checkRateLimit(id, 'email'), false);

  });



  it('rejects invalid OTP expiry configuration', () => {

    const prev = process.env.OTP_EXPIRY_MINUTES;

    process.env.OTP_EXPIRY_MINUTES = '0';

    assert.throws(() => getOTPExpiry(), /between 1 and 60 minutes/);

    process.env.OTP_EXPIRY_MINUTES = prev;

  });

});

