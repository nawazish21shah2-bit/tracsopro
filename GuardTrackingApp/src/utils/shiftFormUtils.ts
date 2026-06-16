export type ScheduleRepeat = 'none' | 'week' | 'month';

export function formatDateInput(iso?: string | Date): string {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatTimeInput(iso?: string | Date): string {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function combineDateTime(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function getDefaultShiftSchedule(referenceDate?: string) {
  const date = referenceDate || formatDateInput(new Date());
  return {
    startDate: date,
    startTime: '09:00',
    endDate: date,
    endTime: '17:00',
  };
}

export interface ShiftScheduleValidationOptions {
  requireFuture?: boolean;
}

export function validateShiftSchedule(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  options: ShiftScheduleValidationOptions = {},
): { valid: boolean; message?: string } {
  if (!startDate || !startTime || !endDate || !endTime) {
    return { valid: false, message: 'Please fill in all date and time fields.' };
  }

  const scheduledStartTime = combineDateTime(startDate, startTime);
  const scheduledEndTime = combineDateTime(endDate, endTime);

  if (Number.isNaN(new Date(scheduledStartTime).getTime()) || Number.isNaN(new Date(scheduledEndTime).getTime())) {
    return { valid: false, message: 'Invalid date or time. Use YYYY-MM-DD and HH:MM (24h).' };
  }

  if (new Date(scheduledStartTime) >= new Date(scheduledEndTime)) {
    return { valid: false, message: 'End time must be after start time.' };
  }

  if (options.requireFuture && new Date(scheduledStartTime) <= new Date()) {
    return { valid: false, message: 'Start time must be in the future.' };
  }

  return { valid: true };
}

export function getRepeatSuccessMessage(repeat: ScheduleRepeat): string {
  if (repeat === 'week') return '7 shifts scheduled for the week!';
  if (repeat === 'month') return '30 shifts scheduled for the month!';
  return 'Shift created successfully!';
}
