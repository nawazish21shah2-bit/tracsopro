import { UserRole } from '../types';

/** Screen name for the in-app notification list, per role stack. */
export function getNotificationsRouteForRole(role?: string | null): string {
  switch (role) {
    case UserRole.CLIENT:
    case 'CLIENT':
      return 'ClientNotifications';
    case UserRole.ADMIN:
    case 'ADMIN':
      return 'AdminNotifications';
    case 'SUPER_ADMIN':
      return 'SuperAdminNotifications';
    case UserRole.GUARD:
    case 'GUARD':
    default:
      return 'Notifications';
  }
}

/** Screen name for notification preference settings, per role stack. */
export function getNotificationSettingsRouteForRole(role?: string | null): string {
  switch (role) {
    case UserRole.CLIENT:
    case 'CLIENT':
      return 'NotificationSettings';
    case UserRole.ADMIN:
    case 'ADMIN':
      return 'AdminNotificationSettings';
    case 'SUPER_ADMIN':
      return 'SuperAdminNotificationSettings';
    case UserRole.GUARD:
    case 'GUARD':
    default:
      return 'GuardNotificationSettings';
  }
}
