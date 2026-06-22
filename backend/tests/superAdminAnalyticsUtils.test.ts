import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePeriod,
  calcGrowth,
  metricWithGrowth,
  getChartBucketCount,
  bucketRevenueFromRecords,
  bucketCumulativeUsers,
  getBucketIndexForDate,
  getPeriodRanges,
  buildChartLabels,
  getBucketDateRange,
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

  it('getBucketIndexForDate assigns dates to buckets', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-08T00:00:00Z');
    const idx = getBucketIndexForDate(new Date('2026-01-04T12:00:00Z'), start, end, 7);
    assert.ok(idx >= 0 && idx < 7);
  });

  it('bucketRevenueFromRecords sums paid amounts per bucket', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-03T00:00:00Z');
    const buckets = bucketRevenueFromRecords(
      [
        { amount: 100, paidDate: new Date('2026-01-01T10:00:00Z') },
        { amount: 50, paidDate: new Date('2026-01-02T10:00:00Z') },
        { amount: 25, paidDate: null },
      ],
      start,
      end,
      2
    );
    assert.equal(buckets.length, 2);
    assert.equal(buckets[0] + buckets[1], 150);
  });

  it('bucketCumulativeUsers returns non-decreasing counts', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-04T00:00:00Z');
    const buckets = bucketCumulativeUsers(
      [
        new Date('2026-01-01T08:00:00Z').getTime(),
        new Date('2026-01-02T08:00:00Z').getTime(),
        new Date('2026-01-03T08:00:00Z').getTime(),
      ],
      '7d',
      start,
      end,
      3
    );
    assert.equal(buckets.length, 3);
    assert.ok(buckets[0] <= buckets[1]);
    assert.ok(buckets[1] <= buckets[2]);
    assert.equal(buckets[2], 3);
  });

  it('getPeriodRanges returns current and previous windows', () => {
    const ranges = getPeriodRanges('7d');
    assert.ok(ranges.currentStart < ranges.currentEnd);
    assert.ok(ranges.previousStart < ranges.previousEnd);
    assert.ok(ranges.previousEnd < ranges.currentStart);
  });

  it('buildChartLabels formats weekly and monthly labels', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    assert.equal(buildChartLabels('30d', start, 4)[0], 'W1');
    assert.equal(buildChartLabels('90d', start, 3)[2], 'M3');
  });

  it('getBucketDateRange covers full span on last bucket', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-08T00:00:00Z');
    const last = getBucketDateRange('7d', start, end, 6, 7);
    assert.equal(last.bucketEnd.getTime(), end.getTime());
  });
});
