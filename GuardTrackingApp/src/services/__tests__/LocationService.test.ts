// Location Service Tests - Testing location tracking, permissions, and geofencing
import LocationService, { LocationData, GeofenceRegion } from '../LocationService';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api';

// Mock dependencies
jest.mock('react-native-geolocation-service');
jest.mock('react-native', () => ({
  PermissionsAndroid: {
    requestMultiple: jest.fn(),
    PERMISSIONS: {
      ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
      ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
    },
  },
  Platform: {
    OS: 'android',
  },
  Alert: {
    alert: jest.fn(),
  },
}));
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../api');
jest.mock('react-native-background-job', () => ({
  register: jest.fn(),
  on: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
}));

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    jest.clearAllMocks();
    locationService = new LocationService();
  });

  describe('Permission Handling', () => {
    it('should request location permission on Android', async () => {
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.ACCESS_FINE_LOCATION': 'granted',
        'android.permission.ACCESS_BACKGROUND_LOCATION': 'granted',
      });

      const result = await locationService.requestLocationPermission();

      expect(PermissionsAndroid.requestMultiple).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle permission denial', async () => {
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.ACCESS_FINE_LOCATION': 'denied',
      });

      const result = await locationService.requestLocationPermission();

      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should handle permission request error', async () => {
      (PermissionsAndroid.requestMultiple as jest.Mock).mockRejectedValue(
        new Error('Permission error')
      );

      const result = await locationService.requestLocationPermission();

      expect(result).toBe(false);
    });
  });

  describe('Location Tracking', () => {
    it('should start tracking when permission granted', async () => {
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.ACCESS_FINE_LOCATION': 'granted',
      });

      const mockWatchPosition = jest.fn((success, error, options) => {
        // Simulate location update
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
        return 1; // watchId
      });

      (Geolocation.watchPosition as jest.Mock) = mockWatchPosition;

      const result = await locationService.startTracking('guard-123');

      expect(result).toBe(true);
      expect(Geolocation.watchPosition).toHaveBeenCalled();
    });

    it('should not start tracking without permission', async () => {
      (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValue({
        'android.permission.ACCESS_FINE_LOCATION': 'denied',
      });

      const result = await locationService.startTracking('guard-123');

      expect(result).toBe(false);
      expect(Geolocation.watchPosition).not.toHaveBeenCalled();
    });

    it('should stop tracking', () => {
      const mockClearWatch = jest.fn();
      (Geolocation.clearWatch as jest.Mock) = mockClearWatch;

      // Set watchId first
      (locationService as any).watchId = 1;
      locationService.stopTracking();

      expect(mockClearWatch).toHaveBeenCalledWith(1);
    });

    it('should get current location', async () => {
      const mockLocation = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (success) => {
          success(mockLocation);
        }
      );

      const location = await locationService.getCurrentLocation('guard-123');

      expect(location).toBeDefined();
      expect(location?.latitude).toBe(40.7128);
      expect(location?.longitude).toBe(-74.0060);
    });

    it('should handle location error', async () => {
      (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(
        (success, error) => {
          error({
            code: 1,
            message: 'Location unavailable',
          });
        }
      );

      await expect(
        locationService.getCurrentLocation('guard-123')
      ).rejects.toThrow();
    });
  });

  describe('Geofencing', () => {
    it('should add geofence', () => {
      const geofence: GeofenceRegion = {
        id: '1',
        name: 'Test Zone',
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 100,
        isActive: true,
      };

      locationService.addGeofence(geofence);

      const geofences = locationService.getGeofences();
      expect(geofences).toContainEqual(geofence);
    });

    it('should remove geofence', () => {
      const geofence: GeofenceRegion = {
        id: '1',
        name: 'Test Zone',
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 100,
        isActive: true,
      };

      locationService.addGeofence(geofence);
      locationService.removeGeofence('1');

      const geofences = locationService.getGeofences();
      expect(geofences).not.toContainEqual(geofence);
    });

    it('should check if location is inside geofence', () => {
      const geofence: GeofenceRegion = {
        id: '1',
        name: 'Test Zone',
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 100, // 100 meters
        isActive: true,
      };

      locationService.addGeofence(geofence);

      // Location inside geofence (very close)
      const locationInside: LocationData = {
        latitude: 40.7129,
        longitude: -74.0061,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const isInside = locationService.isInsideGeofence(
        locationInside,
        '1'
      );
      expect(isInside).toBe(true);
    });

    it('should detect geofence entry', () => {
      const geofence: GeofenceRegion = {
        id: '1',
        name: 'Test Zone',
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 100,
        isActive: true,
      };

      locationService.addGeofence(geofence);

      const locationInside: LocationData = {
        latitude: 40.7129,
        longitude: -74.0061,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const callback = jest.fn();
      locationService.onGeofenceEvent(callback);

      // Simulate entering geofence
      locationService.checkGeofences(locationInside);

      // Verify callback was called
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Location Updates', () => {
    it('should send location update to API', async () => {
      const locationData: LocationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now(),
      };

      (apiService.post as jest.Mock).mockResolvedValue({
        success: true,
      });

      await locationService.sendLocationUpdate('guard-123', locationData);

      expect(apiService.post).toHaveBeenCalledWith(
        '/tracking/location',
        expect.objectContaining({
          guardId: 'guard-123',
          latitude: 40.7128,
          longitude: -74.0060,
        })
      );
    });

    it('should buffer location updates when offline', async () => {
      const locationData: LocationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now(),
      };

      (apiService.post as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await locationService.sendLocationUpdate('guard-123', locationData);

      // Location should be buffered
      const buffer = (locationService as any).locationBuffer;
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});



