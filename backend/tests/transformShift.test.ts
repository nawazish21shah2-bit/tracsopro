import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { transformShiftForFrontend } from '../src/services/shift/transformShift.js';

describe('transformShiftForFrontend', () => {
  it('maps scheduled times to startTime/endTime', () => {
    const start = new Date('2026-06-01T08:00:00Z');
    const end = new Date('2026-06-01T16:00:00Z');
    const result = transformShiftForFrontend({
      id: 'shift-1',
      scheduledStartTime: start,
      scheduledEndTime: end,
    }) as Record<string, unknown>;

    assert.equal(result.startTime, start);
    assert.equal(result.endTime, end);
  });

  it('maps actual times to checkIn/checkOut aliases', () => {
    const checkIn = new Date('2026-06-01T08:05:00Z');
    const result = transformShiftForFrontend({
      actualStartTime: checkIn,
    }) as Record<string, unknown>;
    assert.equal(result.checkInTime, checkIn);
  });

  it('transforms arrays', () => {
    const rows = transformShiftForFrontend([
      { scheduledStartTime: new Date('2026-06-01T08:00:00Z') },
    ]) as Record<string, unknown>[];
    assert.equal(rows.length, 1);
    assert.ok(rows[0].startTime);
  });
});
