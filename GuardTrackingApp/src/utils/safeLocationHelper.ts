/**
 * Safe Location Helper - Avoids InteractionManager and React Native scheduler issues
 * Uses setImmediate and proper async isolation to prevent crashes
 */

import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Safely defer execution without triggering React Native scheduler issues
 */
function safeDefer(callback: () => void, delay: number = 0): void {
  if (delay === 0) {
    // Use setImmediate if available (more native-friendly than setTimeout)
    if (typeof setImmediate !== 'undefined') {
      setImmediate(callback);
    } else {
      // Fallback to setTimeout with 0 delay
      setTimeout(callback, 0);
    }
  } else {
    setTimeout(callback, delay);
  }
}

/**
 * Request location permission (Android only)
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS handles permissions automatically
  }

  try {
    // Check if permission is already granted
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (hasPermission) {
      return true;
    }

    // Request permission
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location for check-in and emergency alerts.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Get current location safely without triggering scheduler issues
 */
export function getCurrentLocationSafe(
  options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }
): Promise<{ latitude: number; longitude: number; accuracy: number; address?: string }> {
  return new Promise((resolve, reject) => {
    // First, defer the entire operation to avoid scheduler conflicts
    safeDefer(() => {
      // Validate Geolocation module exists
      if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
        reject(new Error('Location service is not available. Please restart the app.'));
        return;
      }

      // Use safe, simple options
      const geoOptions: Geolocation.GeoOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 60000,
      };

      // Call getCurrentPosition directly without nested Promises
      try {
        Geolocation.getCurrentPosition(
          (position) => {
            try {
              // Validate position data
              if (!position?.coords) {
                reject(new Error('No position data received.'));
                return;
              }

              const { latitude, longitude, accuracy } = position.coords;

              if (
                typeof latitude !== 'number' ||
                typeof longitude !== 'number' ||
                isNaN(latitude) ||
                isNaN(longitude)
              ) {
                reject(new Error('Invalid location data received.'));
                return;
              }

              resolve({
                latitude,
                longitude,
                accuracy: accuracy || 0,
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              });
            } catch (parseError) {
              console.error('Error parsing location:', parseError);
              reject(new Error('Failed to process location data.'));
            }
          },
          (error) => {
            console.error('Location error:', error);
            
            let errorMessage = 'Unable to get your location.';
            if (error?.code === 1) {
              errorMessage = 'Location permission denied. Please enable location access in settings.';
            } else if (error?.code === 2) {
              errorMessage = 'Location unavailable. Please ensure GPS is enabled.';
            } else if (error?.code === 3) {
              errorMessage = 'Location request timed out. Please try again.';
            }

            reject(new Error(errorMessage));
          },
          geoOptions
        );
      } catch (nativeError: any) {
        console.error('Native error calling getCurrentPosition:', nativeError);
        reject(new Error('Failed to get location. Please try again.'));
      }
    }, 100); // Small delay to ensure native module is ready
  });
}

/**
 * Get current location with retry logic
 */
export async function getCurrentLocationWithRetry(
  retries: number = 2
): Promise<{ latitude: number; longitude: number; accuracy: number; address?: string }> {
  // Check permission first
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission denied. Please enable location access in settings.');
  }

  // Try with high accuracy first, then fallback to lower accuracy
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const useHighAccuracy = attempt === 0;
      return await getCurrentLocationSafe({
        enableHighAccuracy: useHighAccuracy,
        timeout: 15000,
        maximumAge: 60000,
      });
    } catch (error: any) {
      // Don't retry permission errors
      if (error?.message?.includes('permission denied')) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying
      await new Promise<void>((resolve) => {
        safeDefer(() => resolve(), 2000);
      });
    }
  }

  throw new Error('Unable to get your location after multiple attempts.');
}

