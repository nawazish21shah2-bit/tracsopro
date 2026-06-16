import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePeriod,
  calcGrowth,
  metricWithGrowth,
  getChartBucketCount,
} from '../src/utils/superAdminAnalyticsUtils.js';

describe('superAdminAnalyticsUtils', () => {
  it('parsePeriod defaults to 30d for invalid input', () => {
    assert.equal(parsePeriod(undefined), '30d');
    assert.equal(parsePeriod('invalid'), '30d');
  });

  it('parsePeriod accepts valid periods', () => {
    assert.equal(parsePeriod('7d'), '7d');
    assert.equal(parsePeriod('1y'), '1y');
  });

  it('calcGrowth handles zero previous', () => {
    assert.equal(calcGrowth(0, 0), 0);
    assert.equal(calcGrowth(10, 0), 100);
  });

  it('calcGrowth computes percentage change', () => {
    assert.equal(calcGrowth(150, 100), 50);
    assert.equal(calcGrowth(50, 100), -50);
  });

  it('metricWithGrowth returns structured metric', () => {
    const m = metricWithGrowth(20, 10);
    assert.equal(m.current, 20);
    assert.equal(m.previous, 10);
    assert.equal(m.growth, 100);
  });

  it('getChartBucketCount returns expected bucket counts', () => {
    assert.equal(getChartBucketCount('7d'), 7);
    assert.equal(getChartBucketCount('30d'), 12);
  });
});
