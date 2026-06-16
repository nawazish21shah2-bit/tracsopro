import { COLORS } from '../styles/globalStyles';

export type ShiftStatusKey =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'MISSED'
  | 'NO_SHOW'
  | 'active'
  | 'upcoming'
  | 'completed'
  | 'missed';

export function normalizeShiftStatus(status?: string): string {
  return (status || '').toUpperCase().replace('-', '_');
}

export function getShiftStatusLabel(status?: string): string {
  const key = normalizeShiftStatus(status);
  switch (key) {
    case 'IN_PROGRESS':
    case 'ACTIVE':
      return 'Active';
    case 'SCHEDULED':
    case 'UPCOMING':
      return 'Upcoming';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'MISSED':
      return 'Missed';
    case 'NO_SHOW':
      return 'No Show';
    default:
      return status?.replace(/_/g, ' ') || 'Unknown';
  }
}

export function getShiftStatusColor(status?: string): string {
  const key = normalizeShiftStatus(status);
  switch (key) {
    case 'SCHEDULED':
    case 'UPCOMING':
      return COLORS.primary;
    case 'IN_PROGRESS':
    case 'ACTIVE':
      return COLORS.success;
    case 'COMPLETED':
      return COLORS.textSecondary;
    case 'CANCELLED':
    case 'MISSED':
    case 'NO_SHOW':
      return COLORS.error;
    default:
      return COLORS.textSecondary;
  }
}

export function getShiftStatusBgColor(status?: string): string {
  return `${getShiftStatusColor(status)}22`;
}

export function formatShiftDateTime(value?: string): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return value;
  }
}

export function formatShiftTimeRange(start?: string, end?: string): string {
  const s = formatShiftDateTime(start);
  const e = formatShiftDateTime(end);
  if (s === '—' && e === '—') return '—';
  return `${s} – ${e}`;
}
