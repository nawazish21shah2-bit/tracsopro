import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { usageRow } from '../src/utils/usageMetrics.js';

describe('usageMetrics', () => {
  it('usageRow calculates percent capped at 100', () => {
    assert.deepEqual(usageRow(5, 10), { used: 5, max: 10, percent: 50 });
    assert.deepEqual(usageRow(12, 10), { used: 12, max: 10, percent: 100 });
  });

  it('usageRow returns zero percent when max is zero', () => {
    assert.deepEqual(usageRow(0, 0), { used: 0, max: 0, percent: 0 });
  });
});
