import apiService from '../api';

export const notificationApi = {
  getNotifications: (options?: Parameters<typeof apiService.getNotifications>[0]) =>
    apiService.getNotifications(options),
  getUnreadNotificationCount: () => apiService.getUnreadNotificationCount(),
  markNotificationAsRead: (notificationId: string) =>
    apiService.markNotificationAsRead(notificationId),
  markAllNotificationsAsRead: () => apiService.markAllNotificationsAsRead(),
  deleteNotification: (notificationId: string) => apiService.deleteNotification(notificationId),
  clearAllNotifications: () => apiService.clearAllNotifications(),
  registerDeviceToken: (
    token: string,
    platform: string,
    deviceId?: string,
  ) => apiService.registerDeviceToken(token, platform, deviceId),
  recordNotificationEvent: (
    event: Parameters<typeof apiService.recordNotificationEvent>[0],
  ) => apiService.recordNotificationEvent(event),
  getNotificationStats: (params?: Parameters<typeof apiService.getNotificationStats>[0]) =>
    apiService.getNotificationStats(params),
};
