export type ShiftRepeatPattern = 'none' | 'week' | 'month';

export interface ShiftOccurrence {
  scheduledStartTime: Date;
  scheduledEndTime: Date;
}

/** Build shift occurrences for week (7 days) or month (30 days) from a template day. */
export const buildShiftOccurrences = (
  start: Date,
  end: Date,
  repeatPattern: ShiftRepeatPattern
): ShiftOccurrence[] => {
  if (repeatPattern === 'none') {
    return [{ scheduledStartTime: new Date(start), scheduledEndTime: new Date(end) }];
  }

  const durationMs = end.getTime() - start.getTime();
  const dayCount = repeatPattern === 'week' ? 7 : 30;
  const occurrences: ShiftOccurrence[] = [];

  for (let i = 0; i < dayCount; i++) {
    const dayStart = new Date(start);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart.getTime() + durationMs);
    occurrences.push({ scheduledStartTime: dayStart, scheduledEndTime: dayEnd });
  }

  return occurrences;
};
