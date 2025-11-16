// Location Service with Background Tracking
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import BackgroundJob from 'react-native-background-job';
import { logger } from '../utils/logger';
import apiService from './api';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  batteryLevel?: number;
}

export interface GeofenceRegion {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  isActive: boolean;
}

class LocationService {
  private watchId: number | null = null;
  private backgroundJobKey: string = 'locationTracking';
  private trackingInterval: number = 30000; // 30 seconds
  private isTracking: boolean = false;
  private geofences: GeofenceRegion[] = [];
  private lastKnownLocation: LocationData | null = null;
  private locationBuffer: LocationData[] = [];
  private maxBufferSize: number = 50;

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Load cached geofences
      await this.loadGeofences();
      
      // Load last known location
      await this.loadLastKnownLocation();
      
      logger.info('LocationService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize LocationService:', error);
    }
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ]);

        const fineLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted';
        const backgroundLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION] === 'granted';

        if (!fineLocationGranted) {
          Alert.alert(
            'Location Permission Required',
            'This app needs location access to track your shifts and ensure safety.',
            [{ text: 'OK' }]
          );
          return false;
        }

        if (!backgroundLocationGranted) {
          Alert.alert(
            'Background Location Required',
            'Please enable "Allow all the time" for location access to track your location during shifts.',
            [{ text: 'OK' }]
          );
        }

        return fineLocationGranted;
      }

      // iOS permission handling would go here
      return true;
    } catch (error) {
      logger.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Start location tracking
   */
  async startTracking(guardId: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return false;
      }

      if (this.isTracking) {
        logger.warn('Location tracking is already active');
        return true;
      }

      // Start foreground location tracking
      this.watchId = Geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          };

          this.handleLocationUpdate(locationData, guardId);
        },
        (error) => {
          logger.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update every 10 meters
          interval: this.trackingInterval,
          fastestInterval: 15000, // Fastest update: 15 seconds
        }
      );

      // Start background job for continuous tracking
      BackgroundJob.register({
        jobKey: this.backgroundJobKey,
        period: this.trackingInterval,
      });

      BackgroundJob.on(this.backgroundJobKey, () => {
        this.getCurrentLocation(guardId);
      });

      BackgroundJob.start({
        jobKey: this.backgroundJobKey,
      });

      this.isTracking = true;
      await AsyncStorage.setItem('isLocationTracking', 'true');
      await AsyncStorage.setItem('trackingGuardId', guardId);

      logger.info('Location tracking started for guard:', guardId);
      return true;
    } catch (error) {
      logger.error('Failed to start location tracking:', error);
      return false;
    }
  }

  /**
   * Stop location tracking
   */
  async stopTracking(): Promise<void> {
    try {
      if (this.watchId !== null) {
        Geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      BackgroundJob.stop({
        jobKey: this.backgroundJobKey,
      });

      this.isTracking = false;
      await AsyncStorage.setItem('isLocationTracking', 'false');
      await AsyncStorage.removeItem('trackingGuardId');

      // Upload any remaining buffered locations
      await this.uploadBufferedLocations();

      logger.info('Location tracking stopped');
    } catch (error) {
      logger.error('Failed to stop location tracking:', error);
    }
  }

  /**
   * Get current location
   */
  private async getCurrentLocation(guardId: string): Promise<void> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
          };

          this.handleLocationUpdate(locationData, guardId);
          resolve();
        },
        (error) => {
          logger.error('Failed to get current location:', error);
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Handle location update
   */
  private async handleLocationUpdate(locationData: LocationData, guardId: string): Promise<void> {
    try {
      // Add battery level if available
      // Note: Battery level would need react-native-device-info package
      // locationData.batteryLevel = await getBatteryLevel();

      this.lastKnownLocation = locationData;
      await this.saveLastKnownLocation(locationData);

      // Check geofences
      await this.checkGeofences(locationData, guardId);

      // Buffer location for batch upload
      this.locationBuffer.push(locationData);

      // Upload if buffer is full or if it's been a while
      if (this.locationBuffer.length >= this.maxBufferSize) {
        await this.uploadBufferedLocations();
      }

      logger.debug('Location updated:', {
        lat: locationData.latitude,
        lng: locationData.longitude,
        accuracy: locationData.accuracy,
      });
    } catch (error) {
      logger.error('Failed to handle location update:', error);
    }
  }

  /**
   * Upload buffered locations to server
   */
  private async uploadBufferedLocations(): Promise<void> {
    if (this.locationBuffer.length === 0) return;

    try {
      const guardId = await AsyncStorage.getItem('trackingGuardId');
      if (!guardId) return;

      // Upload locations in batch
      for (const location of this.locationBuffer) {
        await apiService.recordLocation(guardId, location);
      }

      // Clear buffer after successful upload
      this.locationBuffer = [];
      logger.info(`Uploaded ${this.locationBuffer.length} locations to server`);
    } catch (error) {
      logger.error('Failed to upload locations:', error);
      // Keep locations in buffer for retry
    }
  }

  /**
   * Add geofence region
   */
  async addGeofence(region: GeofenceRegion): Promise<void> {
    try {
      this.geofences.push(region);
      await this.saveGeofences();
      logger.info('Geofence added:', region.name);
    } catch (error) {
      logger.error('Failed to add geofence:', error);
    }
  }

  /**
   * Remove geofence region
   */
  async removeGeofence(regionId: string): Promise<void> {
    try {
      this.geofences = this.geofences.filter(fence => fence.id !== regionId);
      await this.saveGeofences();
      logger.info('Geofence removed:', regionId);
    } catch (error) {
      logger.error('Failed to remove geofence:', error);
    }
  }

  /**
   * Check if location is within any geofences
   */
  private async checkGeofences(location: LocationData, guardId: string): Promise<void> {
    for (const geofence of this.geofences) {
      if (!geofence.isActive) continue;

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geofence.latitude,
        geofence.longitude
      );

      const isInside = distance <= geofence.radius;
      const wasInside = await this.wasInsideGeofence(geofence.id);

      if (isInside && !wasInside) {
        // Entered geofence
        await this.handleGeofenceEnter(geofence, guardId, location);
      } else if (!isInside && wasInside) {
        // Exited geofence
        await this.handleGeofenceExit(geofence, guardId, location);
      }

      await AsyncStorage.setItem(`geofence_${geofence.id}`, isInside.toString());
    }
  }

  /**
   * Handle geofence enter event
   */
  private async handleGeofenceEnter(
    geofence: GeofenceRegion,
    guardId: string,
    location: LocationData
  ): Promise<void> {
    try {
      logger.info(`Entered geofence: ${geofence.name}`);
      
      // Notify server about geofence entry
      await apiService.recordGeofenceEvent({
        guardId,
        geofenceId: geofence.id,
        eventType: 'ENTER',
        location,
        timestamp: Date.now(),
      });

      // Could trigger automatic check-in here
      // await this.triggerAutoCheckIn(geofence, guardId);
    } catch (error) {
      logger.error('Failed to handle geofence enter:', error);
    }
  }

  /**
   * Handle geofence exit event
   */
  private async handleGeofenceExit(
    geofence: GeofenceRegion,
    guardId: string,
    location: LocationData
  ): Promise<void> {
    try {
      logger.info(`Exited geofence: ${geofence.name}`);
      
      // Notify server about geofence exit
      await apiService.recordGeofenceEvent({
        guardId,
        geofenceId: geofence.id,
        eventType: 'EXIT',
        location,
        timestamp: Date.now(),
      });

      // Could trigger automatic check-out here
      // await this.triggerAutoCheckOut(geofence, guardId);
    } catch (error) {
      logger.error('Failed to handle geofence exit:', error);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if was inside geofence
   */
  private async wasInsideGeofence(geofenceId: string): Promise<boolean> {
    try {
      const wasInside = await AsyncStorage.getItem(`geofence_${geofenceId}`);
      return wasInside === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Save geofences to storage
   */
  private async saveGeofences(): Promise<void> {
    try {
      await AsyncStorage.setItem('geofences', JSON.stringify(this.geofences));
    } catch (error) {
      logger.error('Failed to save geofences:', error);
    }
  }

  /**
   * Load geofences from storage
   */
  private async loadGeofences(): Promise<void> {
    try {
      const geofencesData = await AsyncStorage.getItem('geofences');
      if (geofencesData) {
        this.geofences = JSON.parse(geofencesData);
      }
    } catch (error) {
      logger.error('Failed to load geofences:', error);
    }
  }

  /**
   * Save last known location
   */
  private async saveLastKnownLocation(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(location));
    } catch (error) {
      logger.error('Failed to save last known location:', error);
    }
  }

  /**
   * Load last known location
   */
  private async loadLastKnownLocation(): Promise<void> {
    try {
      const locationData = await AsyncStorage.getItem('lastKnownLocation');
      if (locationData) {
        this.lastKnownLocation = JSON.parse(locationData);
      }
    } catch (error) {
      logger.error('Failed to load last known location:', error);
    }
  }

  /**
   * Get current tracking status
   */
  getTrackingStatus(): boolean {
    return this.isTracking;
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Get active geofences
   */
  getGeofences(): GeofenceRegion[] {
    return this.geofences;
  }

  /**
   * Resume tracking if it was active
   */
  async resumeTrackingIfActive(): Promise<void> {
    try {
      const isTracking = await AsyncStorage.getItem('isLocationTracking');
      const guardId = await AsyncStorage.getItem('trackingGuardId');

      if (isTracking === 'true' && guardId) {
        await this.startTracking(guardId);
        logger.info('Resumed location tracking for guard:', guardId);
      }
    } catch (error) {
      logger.error('Failed to resume tracking:', error);
    }
  }
}

export default new LocationService();
