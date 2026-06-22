import Geolocation from 'react-native-geolocation-service';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { requestLocationPermission } from '../utils/safeLocationHelper';

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

interface CachedPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

class LocationValidationService {
  private static instance: LocationValidationService;
  private watchId: number | null = null;
  private currentLocation: CachedPosition | null = null;

  static getInstance(): LocationValidationService {
    if (!LocationValidationService.instance) {
      LocationValidationService.instance = new LocationValidationService();
    }
    return LocationValidationService.instance;
  }

  async requestLocationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const status = await Geolocation.requestAuthorization('whenInUse');
        if (status === 'granted' || status === 'disabled') {
          return status === 'granted';
        }
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to verify your check-in/out location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to verify your check-in/out location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      if (Platform.OS === 'android' && Number(Platform.Version) >= 29) {
        const backgroundGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        );
        if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Background location permission not granted');
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await new Promise<CachedPosition>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => resolve(position),
          (error) => reject(error),
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000,
          },
        );
      });

      this.currentLocation = location;

      const { latitude, longitude, accuracy } = location.coords;

      return {
        latitude,
        longitude,
        accuracy: accuracy || 0,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  async startLocationWatching(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void,
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        return false;
      }

      this.watchId = Geolocation.watchPosition(
        (position) => {
          this.currentLocation = position;

          onLocationUpdate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          console.error('Error watching location:', error);
          onError?.(new Error(error.message || 'Location watch failed'));
        },
        {
          enableHighAccuracy: true,
          interval: 30000,
          distanceFilter: 10,
          fastestInterval: 15000,
        },
      );

      return true;
    } catch (error) {
      console.error('Error starting location watching:', error);
      onError?.(error as Error);
      return false;
    }
  }

  stopLocationWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  isWithinGeofence(
    currentLat: number,
    currentLon: number,
    geofence: GeofenceArea,
  ): boolean {
    const distance = this.calculateDistance(
      currentLat,
      currentLon,
      geofence.latitude,
      geofence.longitude,
    );

    return distance <= geofence.radius;
  }

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
    }
    if (accuracy <= 10) {
      return {
        isValid: true,
        level: 'good',
        message: 'Good GPS accuracy',
      };
    }
    if (accuracy <= 20) {
      return {
        isValid: true,
        level: 'poor',
        message: 'Poor GPS accuracy - consider moving to open area',
      };
    }
    return {
      isValid: false,
      level: 'unacceptable',
      message: 'GPS accuracy too low - please move to an area with better signal',
    };
  }

  async validateCheckInLocation(
    siteLocation: { latitude: number; longitude: number; radius?: number },
    options: {
      allowedRadius?: number;
      requireHighAccuracy?: boolean;
    } = {},
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

      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        siteLocation.latitude,
        siteLocation.longitude,
      );

      const maxAllowedRadius = siteLocation.radius || allowedRadius;
      const isWithinRadius = distance <= maxAllowedRadius;

      return {
        isValid: isWithinRadius,
        distance: Math.round(distance),
        accuracy: currentLocation.accuracy,
        message: isWithinRadius
          ? `Within ${Math.round(distance)}m of site location`
          : `Too far from site (${Math.round(distance)}m away, max ${maxAllowedRadius}m allowed)`,
        location: currentLocation,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Location validation failed: ${message}`);
    }
  }

  formatLocation(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${location.accuracy.toFixed(1)}m)`;
  }

  getCachedLocation(): CachedPosition | null {
    return this.currentLocation;
  }

  clearCache(): void {
    this.currentLocation = null;
  }
}

export default LocationValidationService.getInstance();
