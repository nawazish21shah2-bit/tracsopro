import apiService from '../api';

export const emergencyApi = {
  triggerEmergencyAlert: (
    data: Parameters<typeof apiService.triggerEmergencyAlert>[0],
    options?: Parameters<typeof apiService.triggerEmergencyAlert>[1],
  ) => apiService.triggerEmergencyAlert(data, options),
  getMyActiveEmergencyAlert: () => apiService.getMyActiveEmergencyAlert(),
  getActiveEmergencyAlerts: () => apiService.getActiveEmergencyAlerts(),
  acknowledgeEmergencyAlert: (alertId: string) => apiService.acknowledgeEmergencyAlert(alertId),
  resolveEmergencyAlert: (
    alertId: string,
    resolution: string,
    status?: 'RESOLVED' | 'FALSE_ALARM',
  ) => apiService.resolveEmergencyAlert(alertId, resolution, status),
};
