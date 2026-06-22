export type PeriodKey = '7d' | '30d' | '90d' | '1y';

export function parsePeriod(period?: string): PeriodKey {
  if (period === '7d' || period === '30d' || period === '90d' || period === '1y') {
    return period;
  }
  return '30d';
}

export function getPeriodRanges(period: PeriodKey): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
} {
  const now = new Date();
  const currentEnd = now;
  const msPerDay = 24 * 60 * 60 * 1000;

  const daysMap: Record<PeriodKey, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };

  const days = daysMap[period];
  const currentStart = new Date(now.getTime() - days * msPerDay);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - days * msPerDay);

  return { currentStart, currentEnd, previousStart, previousEnd };
}

export function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function metricWithGrowth(current: number, previous: number) {
  return {
    current,
    previous,
    growth: calcGrowth(current, previous),
  };
}

export function getChartBucketCount(period: PeriodKey): number {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 12;
    case '90d':
      return 12;
    case '1y':
      return 12;
    default:
      return 12;
  }
}

export function buildChartLabels(
  period: PeriodKey,
  startDate: Date,
  bucketCount: number
): string[] {
  const labels: string[] = [];
  const msPerDay = 24 * 60 * 60 * 1000;

  if (period === '7d') {
    for (let i = 0; i < bucketCount; i++) {
      const d = new Date(startDate.getTime() + i * msPerDay);
      labels.push(
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );
    }
    return labels;
  }

  if (period === '30d') {
    for (let i = 0; i < bucketCount; i++) {
      labels.push(`W${i + 1}`);
    }
    return labels;
  }

  for (let i = 0; i < bucketCount; i++) {
    labels.push(`M${i + 1}`);
  }
  return labels;
}

export function getBucketDateRange(
  period: PeriodKey,
  startDate: Date,
  endDate: Date,
  bucketIndex: number,
  bucketCount: number
): { bucketStart: Date; bucketEnd: Date } {
  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketMs = totalMs / bucketCount;
  const bucketStart = new Date(startDate.getTime() + bucketIndex * bucketMs);
  const bucketEnd =
    bucketIndex === bucketCount - 1
      ? endDate
      : new Date(startDate.getTime() + (bucketIndex + 1) * bucketMs - 1);
  return { bucketStart, bucketEnd };
}

export function getBucketIndexForDate(
  date: Date,
  startDate: Date,
  endDate: Date,
  bucketCount: number
): number {
  const t = date.getTime();
  const start = startDate.getTime();
  const end = endDate.getTime();
  if (t < start || t > end) {
    return -1;
  }
  const totalMs = end - start;
  const bucketMs = totalMs / bucketCount;
  const idx = Math.floor((t - start) / bucketMs);
  return Math.min(idx, bucketCount - 1);
}

export function bucketRevenueFromRecords(
  records: { amount: number; paidDate: Date | null }[],
  startDate: Date,
  endDate: Date,
  bucketCount: number
): number[] {
  const buckets = new Array<number>(bucketCount).fill(0);
  for (const record of records) {
    if (!record.paidDate) continue;
    const idx = getBucketIndexForDate(record.paidDate, startDate, endDate, bucketCount);
    if (idx >= 0) {
      buckets[idx] += record.amount;
    }
  }
  return buckets;
}

export function bucketCumulativeUsers(
  createdAtTimestamps: number[],
  period: PeriodKey,
  startDate: Date,
  endDate: Date,
  bucketCount: number
): number[] {
  const sorted = [...createdAtTimestamps].sort((a, b) => a - b);
  const result: number[] = [];
  let ptr = 0;
  for (let i = 0; i < bucketCount; i++) {
    const { bucketEnd } = getBucketDateRange(period, startDate, endDate, i, bucketCount);
    const endMs = bucketEnd.getTime();
    while (ptr < sorted.length && sorted[ptr] <= endMs) {
      ptr++;
    }
    result.push(ptr);
  }
  return result;
}
