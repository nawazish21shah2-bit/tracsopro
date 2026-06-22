export interface EmergencyAlertLike {
  id: string;
  acknowledged?: boolean;
  status?: string;
}

/** Alerts that still need client/admin action (unacknowledged REPORTED state). */
export function isPendingEmergencyAlert(alert: EmergencyAlertLike): boolean {
  if (alert.acknowledged === true) {
    return false;
  }
  const status = (alert.status || '').toUpperCase();
  if (status === 'ACKNOWLEDGED' || status === 'INVESTIGATING') {
    return false;
  }
  if (status === 'RESOLVED' || status === 'CLOSED' || status === 'FALSE_ALARM') {
    return false;
  }
  return true;
}

export function filterPendingEmergencyAlerts<T extends EmergencyAlertLike>(alerts: T[]): T[] {
  return alerts.filter(isPendingEmergencyAlert);
}

export function getCooldownFromMessage(message?: string): number {
  if (!message) return 0;
  const match = message.match(/(\d+)\s*second/i);
  return match ? Number(match[1]) : 0;
}

export function getRemainingCooldownSeconds(
  alertId: string,
  cooldownUntilById: Record<string, number>,
): number {
  const until = cooldownUntilById[alertId];
  if (!until) return 0;
  const remainingMs = until - Date.now();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

export function applyAckCooldown(
  alertId: string,
  seconds: number,
  setCooldownUntilById: (updater: (prev: Record<string, number>) => Record<string, number>) => void,
): void {
  if (seconds <= 0) return;
  setCooldownUntilById((prev) => ({
    ...prev,
    [alertId]: Date.now() + seconds * 1000,
  }));
}

export function isEmergencyNotification(
  notificationType?: string,
  data?: Record<string, unknown>,
): boolean {
  if (!data) return false;
  if (data.alertId) return true;
  const type = String(data.type || notificationType || '').toLowerCase();
  return type.includes('emergency');
}

/** Navigate admin users to the dedicated emergency response screen (not support tickets). */
export function navigateToEmergencyAlertResponse(
  navigation: { navigate: (screen: string, params?: object) => void },
  alertId: string,
): void {
  navigation.navigate('EmergencyAlertResponse', { alertId: parseEmergencyAlertId(alertId) });
}

/** Activity feed prefixes incident ids — normalize before API calls. */
export function parseEmergencyAlertId(rawId: string): string {
  if (rawId.startsWith('incident_')) {
    return rawId.slice('incident_'.length);
  }
  return rawId;
}
