import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import { RootState } from '../../store';
import {
  checkInToShiftWithLocation,
  checkOutFromShiftWithLocation,
  fetchActiveShift,
} from '../../store/slices/shiftSlice';
import { Shift } from '../../types/shift.types';

interface CheckInOutButtonProps {
  shift?: Shift;
  onSuccess?: () => void;
  style?: any;
}

const CheckInOutButton: React.FC<CheckInOutButtonProps> = ({
  shift,
  onSuccess,
  style,
}) => {
  const dispatch = useDispatch();
  const { activeShift, checkInLoading, checkOutLoading } = useSelector(
    (state: RootState) => state.shift
  );
  
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  const currentShift = shift || activeShift;
  const isCheckedIn = currentShift?.status === 'IN_PROGRESS';
  const loading = checkInLoading || checkOutLoading || locationLoading;

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to check in/out of shifts.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentShift) {
      Alert.alert('Error', 'No shift available for check-in');
      return;
    }

    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'Getting your location for check-in...',
        [{ text: 'OK' }]
      );
      await getCurrentLocation();
      return;
    }

    try {
      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || 0,
      };

      await dispatch(checkInToShiftWithLocation({
        shiftId: currentShift.id,
        location: locationData,
      }) as any);

      Alert.alert(
        'Check-In Successful',
        'You have successfully checked in to your shift.',
        [{ text: 'OK' }]
      );

      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Check-In Failed',
        'Unable to check in. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCheckOut = async () => {
    if (!currentShift) {
      Alert.alert('Error', 'No active shift found');
      return;
    }

    if (!currentLocation) {
      Alert.alert(
        'Location Required',
        'Getting your location for check-out...',
        [{ text: 'OK' }]
      );
      await getCurrentLocation();
      return;
    }

    Alert.alert(
      'Confirm Check-Out',
      'Are you sure you want to check out of your shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const locationData = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                accuracy: currentLocation.coords.accuracy || 0,
              };

              await dispatch(checkOutFromShiftWithLocation({
                shiftId: currentShift.id,
                location: locationData,
              }) as any);

              Alert.alert(
                'Check-Out Successful',
                'You have successfully checked out of your shift.',
                [{ text: 'OK' }]
              );

              onSuccess?.();
            } catch (error) {
              Alert.alert(
                'Check-Out Failed',
                'Unable to check out. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    if (locationLoading) return 'Getting Location...';
    return isCheckedIn ? 'Check Out' : 'Check In';
  };

  const getButtonColor = () => {
    if (loading || locationLoading) return styles.buttonDisabled;
    return isCheckedIn ? styles.checkOutButton : styles.checkInButton;
  };

  if (!currentShift) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.noShiftText}>No shift available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.button, getButtonColor()]}
        onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
        disabled={loading || locationLoading}
      >
        {loading || locationLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        )}
      </TouchableOpacity>
      
      {currentLocation && (
        <Text style={styles.locationText}>
          Location: {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButton: {
    backgroundColor: '#22C55E', // Green
  },
  checkOutButton: {
    backgroundColor: '#EF4444', // Red
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF', // Gray
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noShiftText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CheckInOutButton;
