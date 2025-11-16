import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: string;
}

export interface GeofenceArea {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  name: string;
}

class LocationValidationService {
  private static instance: LocationValidationService;
  private watchId: Location.LocationSubscription | null = null;
  private currentLocation: Location.LocationObject | null = null;

  static getInstance(): LocationValidationService {
    if (!LocationValidationService.instance) {
      LocationValidationService.instance = new LocationValidationService();
    }
    return LocationValidationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to verify your check-in/out location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        return false;
      }

      // Also request background permissions for continuous tracking
      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        console.warn('Background location permission not granted');
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location with high accuracy
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      this.currentLocation = location;

      // Get address from coordinates
      let address = '';
      try {
        const [addressResult] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (addressResult) {
          address = `${addressResult.street || ''} ${addressResult.city || ''} ${addressResult.region || ''}`.trim();
        }
      } catch (addressError) {
        console.warn('Could not get address:', addressError);
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        address,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  /**
   * Start watching location changes
   */
  async startLocationWatching(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        return false;
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.currentLocation = location;
          
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: new Date().toISOString(),
          };

          onLocationUpdate(locationData);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location watching:', error);
      onError?.(error as Error);
      return false;
    }
  }

  /**
   * Stop watching location changes
   */
  stopLocationWatching(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if current location is within a geofence area
   */
  isWithinGeofence(
    currentLat: number,
    currentLon: number,
    geofence: GeofenceArea
  ): boolean {
    const distance = this.calculateDistance(
      currentLat,
      currentLon,
      geofence.latitude,
      geofence.longitude
    );

    return distance <= geofence.radius;
  }

  /**
   * Validate location accuracy for check-in/out
   */
  validateLocationAccuracy(accuracy: number): {
    isValid: boolean;
    level: 'excellent' | 'good' | 'poor' | 'unacceptable';
    message: string;
  } {
    if (accuracy <= 5) {
      return {
        isValid: true,
        level: 'excellent',
        message: 'Excellent GPS accuracy',
      };
    } else if (accuracy <= 10) {
      return {
        isValid: true,
        level: 'good',
        message: 'Good GPS accuracy',
      };
    } else if (accuracy <= 20) {
      return {
        isValid: true,
        level: 'poor',
        message: 'Poor GPS accuracy - consider moving to open area',
      };
    } else {
      return {
        isValid: false,
        level: 'unacceptable',
        message: 'GPS accuracy too low - please move to an area with better signal',
      };
    }
  }

  /**
   * Validate check-in location against site location
   */
  async validateCheckInLocation(
    siteLocation: { latitude: number; longitude: number; radius?: number },
    options: {
      allowedRadius?: number;
      requireHighAccuracy?: boolean;
    } = {}
  ): Promise<{
    isValid: boolean;
    distance: number;
    accuracy: number;
    message: string;
    location: LocationData;
  }> {
    const { allowedRadius = 100, requireHighAccuracy = true } = options;

    try {
      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) {
        throw new Error('Could not get current location');
      }

      // Validate accuracy
      const accuracyValidation = this.validateLocationAccuracy(currentLocation.accuracy);
      if (requireHighAccuracy && !accuracyValidation.isValid) {
        return {
          isValid: false,
          distance: 0,
          accuracy: currentLocation.accuracy,
          message: accuracyValidation.message,
          location: currentLocation,
        };
      }

      // Calculate distance to site
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        siteLocation.latitude,
        siteLocation.longitude
      );

      const isWithinRadius = distance <= (siteLocation.radius || allowedRadius);

      return {
        isValid: isWithinRadius,
        distance: Math.round(distance),
        accuracy: currentLocation.accuracy,
        message: isWithinRadius
          ? `Within ${Math.round(distance)}m of site location`
          : `Too far from site (${Math.round(distance)}m away, max ${allowedRadius}m allowed)`,
        location: currentLocation,
      };
    } catch (error) {
      throw new Error(`Location validation failed: ${error.message}`);
    }
  }

  /**
   * Get formatted location string
   */
  formatLocation(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${location.accuracy.toFixed(1)}m)`;
  }

  /**
   * Get current cached location
   */
  getCachedLocation(): Location.LocationObject | null {
    return this.currentLocation;
  }

  /**
   * Clear cached location
   */
  clearCache(): void {
    this.currentLocation = null;
  }
}

export default LocationValidationService.getInstance();
