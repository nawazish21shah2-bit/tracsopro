import apiService from '../api';

export const trackingApi = {
  getLocations: () => apiService.getLocations(),
  updateLocation: (locationData: Parameters<typeof apiService.updateLocation>[0]) =>
    apiService.updateLocation(locationData),
  sendLocationUpdate: (trackingData: Parameters<typeof apiService.sendLocationUpdate>[0]) =>
    apiService.sendLocationUpdate(trackingData),
  getTrackingHistory: (
    guardId: string,
    startDate?: Date,
    endDate?: Date,
  ) => apiService.getTrackingHistory(guardId, startDate, endDate),
  recordLocation: (guardId: string, locationData: Parameters<typeof apiService.recordLocation>[1]) =>
    apiService.recordLocation(guardId, locationData),
  recordGeofenceEvent: (eventData: Parameters<typeof apiService.recordGeofenceEvent>[0]) =>
    apiService.recordGeofenceEvent(eventData),
  getLiveLocations: () => apiService.getLiveLocations(),
  getLocationHistory: (
    guardId: string,
    startDate?: string,
    endDate?: string,
  ) => apiService.getLocationHistory(guardId, startDate, endDate),
};
