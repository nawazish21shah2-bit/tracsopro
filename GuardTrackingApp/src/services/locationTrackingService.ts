/**
 * Real-time Location Tracking Service
 * Advanced GPS tracking with geofencing and route optimization
 */

import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandler } from '../utils/errorHandler';
import { cacheService } from './cacheService';
import notificationService from './notificationService';
import WebSocketService from './WebSocketService';
import { store } from '../store';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  type: 'check_in' | 'patrol' | 'restricted' | 'emergency';
  isActive: boolean;
}

interface LocationTrackingConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  distanceFilter: number;
  interval: number;
  fastestInterval: number;
  enableBackgroundLocation: boolean;
}

class LocationTrackingService {
  private watchId: number | null = null;
  private isTracking: boolean = false;
  private locationHistory: LocationData[] = [];
  private geofences: GeofenceZone[] = [];
  private config: LocationTrackingConfig;
  private lastKnownLocation: LocationData | null = null;
  private trackingStartTime: number | null = null;

  constructor() {
    this.config = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
      distanceFilter: 5, // Update every 5 meters
      interval: 30000, // 30 seconds
      fastestInterval: 10000, // 10 seconds
      enableBackgroundLocation: true,
    };
  }

  /**
   * Initialize location tracking service
   */
  async initialize(): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      // Load saved geofences
      await this.loadGeofences();

      // Load tracking configuration
      await this.loadConfig();

      console.log('📍 Location tracking service initialized');
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'location_tracking_init');
      return false;
    }
  }

  /**
   * Request location permissions
   */
  private async requestLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        ]);

        return (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted' &&
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === 'granted'
        );
      }

      // iOS permissions are handled differently
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'location_permission_request');
      return false;
    }
  }

  /**
   * Start real-time location tracking
   */
  async startTracking(shiftId?: string): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.log('📍 Location tracking already active');
        return true;
      }

      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to track your shift.',
          [{ text: 'OK' }]
        );
        return false;
      }

      this.watchId = Geolocation.watchPosition(
        (position) => {
          this.handleLocationUpdate(position, shiftId);
        },
        (error) => {
          this.handleLocationError(error);
        },
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: this.config.timeout,
          maximumAge: this.config.maximumAge,
          distanceFilter: this.config.distanceFilter,
          interval: this.config.interval,
          fastestInterval: this.config.fastestInterval,
        }
      );

      this.isTracking = true;
      this.trackingStartTime = Date.now();
      
      console.log('📍 Real-time location tracking started');
      
      // Send notification
      await notificationService.sendImmediateNotification(
        'Location Tracking',
        'GPS tracking is now active for your shift',
        { type: 'location_tracking_started', shiftId }
      );

      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'start_location_tracking');
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

      this.isTracking = false;
      
      // Save final location history
      if (this.locationHistory.length > 0) {
        await this.saveLocationHistory();
      }

      const trackingDuration = this.trackingStartTime 
        ? Date.now() - this.trackingStartTime 
        : 0;

      console.log(`📍 Location tracking stopped. Duration: ${Math.round(trackingDuration / 1000)}s`);
      
      // Send notification
      await notificationService.sendImmediateNotification(
        'Location Tracking',
        'GPS tracking has been stopped',
        { 
          type: 'location_tracking_stopped', 
          duration: trackingDuration,
          totalPoints: this.locationHistory.length 
        }
      );

      this.trackingStartTime = null;
    } catch (error) {
      ErrorHandler.handleError(error, 'stop_location_tracking');
    }
  }

  /**
   * Handle location updates
   */
  private async handleLocationUpdate(position: any, shiftId?: string): Promise<void> {
    try {
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      this.lastKnownLocation = locationData;
      this.locationHistory.push(locationData);

      // Limit history size to prevent memory issues
      if (this.locationHistory.length > 1000) {
        this.locationHistory = this.locationHistory.slice(-800);
      }

      // Check geofences
      await this.checkGeofences(locationData);

      // Cache location for offline access
      await cacheService.set('last_known_location', locationData, 60);

      // Send to backend if online
      await this.syncLocationToBackend(locationData, shiftId);

      console.log(`📍 Location updated: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)} (±${locationData.accuracy}m)`);
    } catch (error) {
      ErrorHandler.handleError(error, 'handle_location_update', false);
    }
  }

  /**
   * Handle location errors
   */
  private handleLocationError(error: any): void {
    let errorMessage = 'Location tracking error';
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location permission denied';
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'Location unavailable';
        break;
      case 3: // TIMEOUT
        errorMessage = 'Location request timeout';
        break;
      default:
        errorMessage = `Location error: ${error.message}`;
    }

    ErrorHandler.handleError(new Error(errorMessage), 'location_tracking_error', false);
  }

  /**
   * Get current location (one-time)
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp,
            };
            resolve(locationData);
          },
          (error) => {
            this.handleLocationError(error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        );
      });
    } catch (error) {
      ErrorHandler.handleError(error, 'get_current_location');
      return null;
    }
  }

  /**
   * Add geofence zone
   */
  async addGeofence(geofence: GeofenceZone): Promise<void> {
    try {
      this.geofences.push(geofence);
      await this.saveGeofences();
      console.log(`📍 Geofence added: ${geofence.name} (${geofence.radius}m radius)`);
    } catch (error) {
      ErrorHandler.handleError(error, 'add_geofence');
    }
  }

  /**
   * Remove geofence zone
   */
  async removeGeofence(geofenceId: string): Promise<void> {
    try {
      this.geofences = this.geofences.filter(g => g.id !== geofenceId);
      await this.saveGeofences();
      console.log(`📍 Geofence removed: ${geofenceId}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'remove_geofence');
    }
  }

  /**
   * Check if location is within any geofences
   */
  private async checkGeofences(location: LocationData): Promise<void> {
    try {
      for (const geofence of this.geofences) {
        if (!geofence.isActive) continue;

        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          geofence.latitude,
          geofence.longitude
        );

        if (distance <= geofence.radius) {
          await this.handleGeofenceEntry(geofence, location, distance);
        }
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'check_geofences', false);
    }
  }

  /**
   * Handle geofence entry
   */
  private async handleGeofenceEntry(
    geofence: GeofenceZone, 
    location: LocationData, 
    distance: number
  ): Promise<void> {
    try {
      const message = `Entered ${geofence.name} zone (${distance.toFixed(0)}m from center)`;
      
      // Send notification based on geofence type
      switch (geofence.type) {
        case 'check_in':
          await notificationService.sendImmediateNotification(
            'Check-in Zone',
            `You're now in the ${geofence.name} check-in area`,
            { type: 'geofence_checkin', geofenceId: geofence.id, location }
          );
          break;
          
        case 'patrol':
          await notificationService.sendImmediateNotification(
            'Patrol Point',
            `Patrol point reached: ${geofence.name}`,
            { type: 'geofence_patrol', geofenceId: geofence.id, location }
          );
          break;
          
        case 'restricted':
          await notificationService.sendImmediateNotification(
            '⚠️ Restricted Area',
            `Warning: You've entered a restricted zone - ${geofence.name}`,
            { type: 'geofence_restricted', geofenceId: geofence.id, location }
          );
          break;
          
        case 'emergency':
          await notificationService.sendEmergencyAlert(
            `Emergency zone activated: ${geofence.name}`,
            { latitude: location.latitude, longitude: location.longitude }
          );
          break;
      }

      // Log geofence event
      await cacheService.addToSyncQueue('geofence_event', {
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        type: geofence.type,
        location,
        distance,
        timestamp: Date.now(),
      });

      console.log(`📍 Geofence triggered: ${message}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'handle_geofence_entry', false);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Sync location to backend
   */
  private async syncLocationToBackend(location: LocationData, shiftId?: string): Promise<void> {
    try {
      // Get guard ID from store
      const state = store.getState();
      const guardId = state.auth.user?.id;
      
      if (!guardId) {
        console.warn('No guard ID available for location update');
        return;
      }

      // Send via WebSocket if connected (real-time)
      if (WebSocketService.isSocketConnected()) {
        WebSocketService.sendLocationUpdate({
          guardId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp || Date.now(),
          batteryLevel: undefined, // Could be added if battery monitoring is available
        });
      } else {
        // Fallback to sync queue if WebSocket is not connected
        await cacheService.addToSyncQueue('location_update', {
          guardId,
          shiftId,
          location,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'sync_location_backend', false);
    }
  }

  /**
   * Save location history to storage
   */
  private async saveLocationHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('location_history', JSON.stringify(this.locationHistory));
    } catch (error) {
      ErrorHandler.handleError(error, 'save_location_history', false);
    }
  }

  /**
   * Load geofences from storage
   */
  private async loadGeofences(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('geofences');
      if (saved) {
        this.geofences = JSON.parse(saved);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_geofences', false);
    }
  }

  /**
   * Save geofences to storage
   */
  private async saveGeofences(): Promise<void> {
    try {
      await AsyncStorage.setItem('geofences', JSON.stringify(this.geofences));
    } catch (error) {
      ErrorHandler.handleError(error, 'save_geofences', false);
    }
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('location_tracking_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_location_config', false);
    }
  }

  /**
   * Update tracking configuration
   */
  async updateConfig(newConfig: Partial<LocationTrackingConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      await AsyncStorage.setItem('location_tracking_config', JSON.stringify(this.config));
      console.log('📍 Location tracking configuration updated');
    } catch (error) {
      ErrorHandler.handleError(error, 'update_location_config');
    }
  }

  /**
   * Get tracking statistics
   */
  getTrackingStats() {
    const totalDistance = this.calculateTotalDistance();
    const averageSpeed = this.calculateAverageSpeed();
    const trackingDuration = this.trackingStartTime ? Date.now() - this.trackingStartTime : 0;

    return {
      isTracking: this.isTracking,
      totalPoints: this.locationHistory.length,
      totalDistance: Math.round(totalDistance),
      averageSpeed: Math.round(averageSpeed * 3.6), // Convert m/s to km/h
      trackingDuration: Math.round(trackingDuration / 1000),
      lastKnownLocation: this.lastKnownLocation,
      activeGeofences: this.geofences.filter(g => g.isActive).length,
    };
  }

  /**
   * Calculate total distance traveled
   */
  private calculateTotalDistance(): number {
    if (this.locationHistory.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < this.locationHistory.length; i++) {
      const prev = this.locationHistory[i - 1];
      const curr = this.locationHistory[i];
      totalDistance += this.calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }
    return totalDistance;
  }

  /**
   * Calculate average speed
   */
  private calculateAverageSpeed(): number {
    if (this.locationHistory.length < 2 || !this.trackingStartTime) return 0;

    const totalDistance = this.calculateTotalDistance();
    const totalTime = (Date.now() - this.trackingStartTime) / 1000; // seconds
    return totalTime > 0 ? totalDistance / totalTime : 0;
  }

  /**
   * Get current tracking status
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Get location history
   */
  getLocationHistory(): LocationData[] {
    return [...this.locationHistory];
  }

  /**
   * Get active geofences
   */
  getGeofences(): GeofenceZone[] {
    return [...this.geofences];
  }

  /**
   * Clear location history
   */
  async clearLocationHistory(): Promise<void> {
    try {
      this.locationHistory = [];
      await AsyncStorage.removeItem('location_history');
      console.log('📍 Location history cleared');
    } catch (error) {
      ErrorHandler.handleError(error, 'clear_location_history');
    }
  }
}

export default new LocationTrackingService();
export { LocationData, GeofenceZone, LocationTrackingConfig };
