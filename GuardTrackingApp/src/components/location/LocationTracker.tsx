// Location Tracker Component
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setTracking, recordLocationData } from '../../store/slices/locationSlice';
import LocationService from '../../services/LocationService';
import WebSocketService from '../../services/WebSocketService';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { MapPinIcon, PlayIcon, StopIcon, WifiIcon, WifiOffIcon } from '../ui/FeatherIcons';

interface LocationTrackerProps {
  guardId: string;
  onLocationUpdate?: (location: { latitude: number; longitude: number; accuracy: number }) => void;
  onTrackingStatusChange?: (isTracking: boolean) => void;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  guardId,
  onLocationUpdate,
  onTrackingStatusChange,
}) => {
  const dispatch = useDispatch();
  const { isTracking, error } = useSelector((state: RootState) => state.locations);
  const [isConnected, setIsConnected] = useState(false);
  const [lastLocation, setLastLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  } | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // Check WebSocket connection status
    const checkConnection = () => {
      setIsConnected(WebSocketService.isSocketConnected());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Resume tracking if it was active
    const resumeTracking = async () => {
      const trackingStatus = LocationService.getTrackingStatus();
      if (trackingStatus) {
        dispatch(setTracking(true));
        onTrackingStatusChange?.(true);
      }
    };

    resumeTracking();
  }, [dispatch, onTrackingStatusChange]);

  const handleStartTracking = async () => {
    try {
      setIsStarting(true);
      
      const success = await LocationService.startTracking(guardId);
      
      if (success) {
        dispatch(setTracking(true));
        onTrackingStatusChange?.(true);
        
        Alert.alert(
          'Location Tracking Started',
          'Your location is now being tracked for safety and shift management.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Location permission is required to track your shifts. Please enable location access in settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
      Alert.alert(
        'Error',
        'Failed to start location tracking. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopTracking = async () => {
    try {
      Alert.alert(
        'Stop Location Tracking',
        'Are you sure you want to stop location tracking? This may affect shift management.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: async () => {
              await LocationService.stopTracking();
              dispatch(setTracking(false));
              onTrackingStatusChange?.(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  };

  const handleManualLocationUpdate = async () => {
    try {
      const lastKnown = LocationService.getLastKnownLocation();
      if (lastKnown) {
        setLastLocation({
          latitude: lastKnown.latitude,
          longitude: lastKnown.longitude,
          accuracy: lastKnown.accuracy,
          timestamp: new Date(lastKnown.timestamp),
        });

        // Record location
        dispatch(recordLocationData({
          guardId,
          latitude: lastKnown.latitude,
          longitude: lastKnown.longitude,
          accuracy: lastKnown.accuracy,
          batteryLevel: lastKnown.batteryLevel,
          timestamp: lastKnown.timestamp,
        }));

        // Send via WebSocket if connected
        if (isConnected) {
          WebSocketService.sendLocationUpdate({
            guardId,
            latitude: lastKnown.latitude,
            longitude: lastKnown.longitude,
            accuracy: lastKnown.accuracy,
            timestamp: lastKnown.timestamp,
            batteryLevel: lastKnown.batteryLevel,
          });
        }

        onLocationUpdate?.({
          latitude: lastKnown.latitude,
          longitude: lastKnown.longitude,
          accuracy: lastKnown.accuracy,
        });
      } else {
        Alert.alert(
          'No Location Available',
          'Unable to get current location. Please ensure location services are enabled.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const getStatusColor = () => {
    if (isTracking) return COLORS.success;
    if (error) return COLORS.error;
    return COLORS.textSecondary;
  };

  const getStatusText = () => {
    if (isStarting) return 'Starting...';
    if (isTracking) return 'Tracking Active';
    if (error) return 'Error';
    return 'Tracking Inactive';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        <View style={styles.connectionContainer}>
          {isConnected ? (
            <WifiIcon size={16} color={COLORS.success} />
          ) : (
            <WifiOffIcon size={16} color={COLORS.error} />
          )}
          <Text style={[styles.connectionText, { color: isConnected ? COLORS.success : COLORS.error }]}>
            {isConnected ? 'Connected' : 'Offline'}
          </Text>
        </View>
      </View>

      {lastLocation && (
        <View style={styles.locationInfo}>
          <MapPinIcon size={16} color={COLORS.textSecondary} />
          <View style={styles.locationDetails}>
            <Text style={styles.coordinatesText}>
              {lastLocation.latitude.toFixed(6)}, {lastLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracyText}>
              Accuracy: {lastLocation.accuracy.toFixed(0)}m • {lastLocation.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.controls}>
        {!isTracking ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStartTracking}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color={COLORS.textInverse} />
            ) : (
              <PlayIcon size={20} color={COLORS.textInverse} />
            )}
            <Text style={styles.startButtonText}>
              {isStarting ? 'Starting...' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopTracking}
            >
              <StopIcon size={20} color={COLORS.textInverse} />
              <Text style={styles.stopButtonText}>Stop Tracking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={handleManualLocationUpdate}
            >
              <MapPinIcon size={20} color={COLORS.primary} />
              <Text style={styles.updateButtonText}>Update Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
    ...globalStyles.shadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  connectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  locationDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  coordinatesText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  accuracyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    backgroundColor: COLORS.errorLight,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
  },
  controls: {
    marginTop: SPACING.sm,
  },
  activeControls: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  startButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  stopButton: {
    backgroundColor: COLORS.error,
    flex: 1,
  },
  stopButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  updateButton: {
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flex: 1,
  },
  updateButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});

export default LocationTracker;
