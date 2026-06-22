import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getLimitsForPlan,
  planFromStripePriceId,
  isTrialStatus,
  getDisplayPlanLabel,
  TRIAL_LIMITS,
} from '../src/utils/planLimits.js';

describe('planLimits', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('getLimitsForPlan returns BASIC limits for unknown plan key', () => {
    const limits = getLimitsForPlan('BASIC');
    assert.equal(limits.maxGuards, 10);
    assert.equal(limits.maxClients, 5);
  });

  it('TRIAL_LIMITS are restricted', () => {
    assert.equal(TRIAL_LIMITS.maxGuards, 2);
    assert.equal(TRIAL_LIMITS.maxSites, 1);
  });

  it('isTrialStatus identifies trial', () => {
    assert.equal(isTrialStatus('TRIAL'), true);
    assert.equal(isTrialStatus('ACTIVE'), false);
  });

  it('getDisplayPlanLabel shows Free Trial when applicable', () => {
    assert.equal(getDisplayPlanLabel('BASIC', 'TRIAL', false), 'Free Trial');
    assert.equal(getDisplayPlanLabel('PROFESSIONAL', 'ACTIVE', true), 'Professional Plan');
  });

  it('planFromStripePriceId matches env price ids', () => {
    process.env.STRIPE_PRICE_BASIC_MONTHLY = 'price_basic_123';
    assert.equal(planFromStripePriceId('price_basic_123'), 'BASIC');
  });

  it('planFromStripePriceId infers plan from price id string', () => {
    assert.equal(planFromStripePriceId('price_enterprise_annual'), 'ENTERPRISE');
    assert.equal(planFromStripePriceId('price_prof_monthly'), 'PROFESSIONAL');
    assert.equal(planFromStripePriceId(null), null);
  });
});
