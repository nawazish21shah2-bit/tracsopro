// Location Service Tests — aligned with current singleton API
import locationService from '../LocationService';
import type { GeofenceRegion } from '../LocationService';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid } from 'react-native';

jest.mock('react-native-geolocation-service');
jest.mock('react-native', () => ({
  PermissionsAndroid: {
    requestMultiple: jest.fn(),
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
    },
  },
  Platform: { OS: 'android' },
  Alert: { alert: jest.fn() },
}));
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../api/trackingApi', () => ({
  trackingApi: {
    recordLocation: jest.fn().mockResolvedValue(undefined),
    recordGeofenceEvent: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('react-native-background-job', () => ({
  register: jest.fn(),
  on: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
}));

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(PermissionsAndroid, 'requestMultiple').mockImplementation(jest.fn());
  });

  describe('Tracking', () => {
    it('starts tracking when permission granted', async () => {
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.ACCESS_FINE_LOCATION': 'granted',
        'android.permission.ACCESS_BACKGROUND_LOCATION': 'granted',
      });
      (Geolocation.watchPosition as jest.Mock).mockReturnValue(1);

      const result = await locationService.startTracking('guard-123');

      expect(result).toBe(true);
      expect(Geolocation.watchPosition).toHaveBeenCalled();
    });

    it('stops tracking and clears watch', async () => {
      (Geolocation.clearWatch as jest.Mock).mockImplementation(() => {});
      (locationService as any).watchId = 1;

      await locationService.stopTracking();

      expect(Geolocation.clearWatch).toHaveBeenCalledWith(1);
      expect(locationService.getTrackingStatus()).toBe(false);
    });
  });

  describe('Geofencing', () => {
    it('adds and removes geofences', async () => {
      const geofence: GeofenceRegion = {
        id: '1',
        name: 'Test Zone',
        latitude: 40.7128,
        longitude: -74.006,
        radius: 100,
        isActive: true,
      };

      await locationService.addGeofence(geofence);
      expect(locationService.getGeofences()).toContainEqual(geofence);

      await locationService.removeGeofence('1');
      expect(locationService.getGeofences()).not.toContainEqual(geofence);
    });
  });
});
