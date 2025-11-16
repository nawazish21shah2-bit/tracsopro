import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootState } from '../store';
import {
  checkInToShiftWithLocation,
  checkOutFromShiftWithLocation,
  fetchActiveShift,
} from '../store/slices/shiftSlice';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/globalStyles';
import { AppScreen, AppCard } from '../components/ui/AppComponents';
import { AppHeader } from '../components/ui/AppHeader';
import CheckInOutButton from '../components/shift/CheckInOutButton';
import ShiftTimer from '../components/shift/ShiftTimer';
import { Shift } from '../types/shift.types';
import {
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from '../components/ui/FeatherIcons';

interface CheckInScreenProps {
  route?: {
    params?: {
      shift?: Shift;
    };
  };
}

const CheckInScreen: React.FC<CheckInScreenProps> = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  
  const { activeShift, checkInLoading, checkOutLoading } = useSelector(
    (state: RootState) => state.shifts
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get shift from route params or use active shift
  const shift = (route.params as any)?.shift || activeShift;
  const isCheckedIn = shift?.status === 'IN_PROGRESS';

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    if (!shift) {
      dispatch(fetchActiveShift() as any);
    }
    await getCurrentLocation();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeData();
    setRefreshing(false);
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      // Mock location for demo purposes
      // In real implementation, you would use expo-location here
      const mockLocation = {
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 5,
        },
        address: '123 Main Street, San Francisco, CA',
      };

      setCurrentLocation(mockLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get your current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!shift) {
      Alert.alert('Error', 'No shift available for check-in');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Location Required', 'Getting your location for check-in...');
      await getCurrentLocation();
      return;
    }

    try {
      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || 0,
        address: currentLocation.address || '',
      };

      await dispatch(checkInToShiftWithLocation({
        shiftId: shift.id,
        location: locationData,
      }) as any);

      Alert.alert(
        'Check-In Successful! 🎉',
        `You have successfully checked in to your shift at ${shift.locationName}.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert(
        'Check-In Failed',
        'Unable to check in. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCheckOut = async () => {
    if (!shift) {
      Alert.alert('Error', 'No active shift found');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Location Required', 'Getting your location for check-out...');
      await getCurrentLocation();
      return;
    }

    Alert.alert(
      'Confirm Check-Out',
      'Are you sure you want to check out of your shift? This will end your current shift.',
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
                address: currentLocation.address || '',
              };

              await dispatch(checkOutFromShiftWithLocation({
                shiftId: shift.id,
                location: locationData,
              }) as any);

              Alert.alert(
                'Check-Out Successful! 👋',
                'You have successfully checked out of your shift. Great work!',
                [{ text: 'OK' }]
              );

            } catch (error) {
              Alert.alert(
                'Check-Out Failed',
                'Unable to check out. Please try again or contact support.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const getLocationAccuracyColor = (accuracy: number) => {
    if (accuracy <= 5) return COLORS.success;
    if (accuracy <= 10) return COLORS.warning;
    return COLORS.error;
  };

  const getLocationAccuracyText = (accuracy: number) => {
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    return 'Poor';
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { backgroundColor: '#DCFCE7', borderColor: COLORS.success };
      case 'SCHEDULED':
        return { backgroundColor: '#DBEAFE', borderColor: COLORS.primary };
      case 'COMPLETED':
        return { backgroundColor: '#F3F4F6', borderColor: COLORS.textSecondary };
      default:
        return { backgroundColor: '#F3F4F6', borderColor: COLORS.textSecondary };
    }
  };

  if (!shift) {
    return (
      <AppScreen>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <AppHeader 
          title={isCheckedIn ? "Check Out" : "Check In"}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.noShiftContainer}>
          <AlertTriangleIcon size={48} color={COLORS.textSecondary} />
          <Text style={styles.noShiftText}>No shift available</Text>
          <Text style={styles.noShiftSubtext}>
            You don't have any scheduled shifts at this time.
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <AppHeader 
        title={isCheckedIn ? "Check Out" : "Check In"}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        
        {/* Shift Information */}
        <AppCard style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <MapPinIcon size={20} color={COLORS.primary} />
            <Text style={styles.shiftTitle}>{shift.locationName}</Text>
          </View>
          <Text style={styles.shiftAddress}>{shift.locationAddress}</Text>
          <View style={styles.shiftTimeContainer}>
            <ClockIcon size={16} color={COLORS.textSecondary} />
            <Text style={styles.shiftTime}>
              {new Date(shift.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })} - {new Date(shift.endTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, getStatusBadgeStyle(shift.status)]}>
            <Text style={styles.statusText}>{shift.status}</Text>
          </View>
        </AppCard>

        {/* Shift Timer (if checked in) */}
        {isCheckedIn && (
          <ShiftTimer shift={shift} style={styles.timerCard} />
        )}

        {/* Location Information */}
        <AppCard style={styles.locationCard}>
          <View style={styles.sectionHeader}>
            <MapPinIcon size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Current Location</Text>
          </View>
          
          {locationLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorContainer}>
              <AlertTriangleIcon size={24} color={COLORS.error} />
              <Text style={styles.errorText}>{locationError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : currentLocation ? (
            <View style={styles.locationInfo}>
              <Text style={styles.coordinatesText}>
                {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
              </Text>
              {currentLocation.address && (
                <Text style={styles.addressText}>{currentLocation.address}</Text>
              )}
              <View style={styles.accuracyContainer}>
                <Text style={styles.accuracyLabel}>Accuracy: </Text>
                <Text style={[
                  styles.accuracyValue,
                  { color: getLocationAccuracyColor(currentLocation.coords.accuracy || 0) }
                ]}>
                  {currentLocation.coords.accuracy?.toFixed(1)}m ({getLocationAccuracyText(currentLocation.coords.accuracy || 0)})
                </Text>
              </View>
            </View>
          ) : null}
        </AppCard>

        {/* Check-In/Out Action */}
        <AppCard style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <CheckCircleIcon size={20} color={COLORS.primary} />
            <Text style={styles.actionTitle}>
              {isCheckedIn ? 'End Your Shift' : 'Start Your Shift'}
            </Text>
          </View>
          
          <Text style={styles.actionSubtitle}>
            {isCheckedIn 
              ? 'Check out when your shift is complete'
              : 'Check in to begin your shift at this location'
            }
          </Text>

          <TouchableOpacity
            style={[
              styles.actionButton,
              isCheckedIn ? styles.checkOutButton : styles.checkInButton,
              (checkInLoading || checkOutLoading || locationLoading) && styles.disabledButton
            ]}
            onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={checkInLoading || checkOutLoading || locationLoading}
          >
            {checkInLoading || checkOutLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>
                {isCheckedIn ? 'Check Out' : 'Check In'}
              </Text>
            )}
          </TouchableOpacity>
        </AppCard>

      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  noShiftContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noShiftText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  noShiftSubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  shiftCard: {
    marginBottom: SPACING.md,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  shiftTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  shiftAddress: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  shiftTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  shiftTime: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: COLORS.textPrimary,
  },
  timerCard: {
    marginBottom: SPACING.md,
  },
  locationCard: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  retryButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  locationInfo: {
    alignItems: 'center',
  },
  coordinatesText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  addressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  accuracyValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  actionCard: {
    marginBottom: SPACING.xl,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  actionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginLeft: SPACING.xs,
  },
  actionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  checkInButton: {
    backgroundColor: COLORS.success,
  },
  checkOutButton: {
    backgroundColor: COLORS.error,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
  },
  actionButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});

export default CheckInScreen;
