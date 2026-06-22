import './setup/env.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Stripe webhook', () => {
  it('rejects webhook without stripe-signature', async () => {
    const previous = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_for_ci';

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' }));

    if (previous === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = previous;
    }

    assert.equal(res.status, 400);
    assert.match(res.body.message || '', /signature|Webhook/i);
  });

  it('rejects webhook when secret is not configured', async () => {
    const previous = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1,v1=fake')
      .send(JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' }));

    if (previous !== undefined) {
      process.env.STRIPE_WEBHOOK_SECRET = previous;
    }

    assert.equal(res.status, 400);
    assert.match(res.body.message || '', /STRIPE_WEBHOOK_SECRET|Webhook/i);
  });
});
