import { Alert } from 'react-native';
import { extractErrorMessage } from './errorHandler';

/** Normalize backend "Cannot schedule shift: …" messages for display */
export function formatSchedulingErrorMessage(message: string): string {
  const trimmed = message.trim();
  const withoutPrefix = trimmed.replace(/^Cannot schedule shift:\s*/i, '').trim();
  return withoutPrefix || trimmed;
}

export function isSchedulingConflictMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('cannot schedule shift') ||
    lower.includes('overlapping shift') ||
    lower.includes('exceeds') ||
    lower.includes('hours this week') ||
    lower.includes('conflict')
  );
}

export function showSchedulingErrorAlert(message: string) {
  const detail = formatSchedulingErrorMessage(message);
  Alert.alert('Cannot Schedule Shift', detail);
}

export function showShiftActionError(actionLabel: string, error: unknown, fallback?: string) {
  const message = extractErrorMessage(error) || fallback || `Failed to ${actionLabel.toLowerCase()}`;

  if (isSchedulingConflictMessage(message)) {
    showSchedulingErrorAlert(message);
    return;
  }

  Alert.alert(`Could Not ${actionLabel}`, message);
}
