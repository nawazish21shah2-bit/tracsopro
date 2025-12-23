/**
 * Enhanced Check-in Screen with Photo Verification
 * GPS-based check-in/out with photo capture and location validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { checkInToShift, checkOutFromShift } from '../../store/slices/shiftSlice';
import { AppScreen } from '../../components/common/AppScreen';
import { AppHeader } from '../../components/common/AppHeader';
import { AppCard } from '../../components/common/AppCard';
import { LoadingOverlay, InlineLoading } from '../../components/ui/LoadingStates';
import {
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  XCircleIcon,
} from '../../components/ui/FeatherIcons';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import locationTrackingService from '../../services/locationTrackingService';
import cameraService, { PhotoMetadata } from '../../services/cameraService';
import biometricAuthService from '../../services/biometricAuthService';
import { locationValidationService } from '../../services/locationValidationService';
import { ErrorHandler } from '../../utils/errorHandler';
import WebSocketService from '../../services/WebSocketService';

const { width: screenWidth } = Dimensions.get('window');

interface EnhancedCheckInScreenProps {
  navigation: any;
  route: any;
}

const EnhancedCheckInScreen: React.FC<EnhancedCheckInScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { activeShift, checkInLoading, checkOutLoading } = useSelector((state: RootState) => state.shifts);
  const { currentLocation } = useSelector((state: RootState) => state.locations);
  
  const { shiftId, siteLocation, isCheckOut = false } = route.params || {};
  
  // Component state
  const [currentLocationData, setCurrentLocationData] = useState<any>(null);
  const [locationValidation, setLocationValidation] = useState<any>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoMetadata | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  // Initialize location and validation
  useEffect(() => {
    initializeLocationValidation();
  }, []);

  const initializeLocationValidation = async () => {
    try {
      setIsLoadingLocation(true);
      
      // Get current location
      const location = await locationTrackingService.getCurrentLocation();
      if (!location) {
        Alert.alert('Location Error', 'Unable to get current location. Please ensure GPS is enabled.');
        return;
      }

      setCurrentLocationData(location);

      // Validate location if site location is provided
      if (siteLocation) {
        const validation = await locationValidationService.validateCheckInLocation(
          siteLocation,
          {
            allowedRadius: 100, // 100 meters
            requireHighAccuracy: true,
          }
        );
        setLocationValidation(validation);
      }

      setIsLoadingLocation(false);
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_location_validation');
      setIsLoadingLocation(false);
      Alert.alert('Error', 'Failed to validate location. Please try again.');
    }
  };

  const handleRefreshLocation = () => {
    initializeLocationValidation();
  };

  const handleTakePhoto = async () => {
    try {
      const purpose = isCheckOut ? 'check_out' : 'check_in';
      const photo = await cameraService.showPhotoOptions(purpose, shiftId);
      
      if (photo) {
        setCapturedPhoto(photo);
        console.log(`📷 Photo captured for ${purpose}: ${photo.fileName}`);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'take_checkin_photo');
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleBiometricVerification = async () => {
    try {
      const action = isCheckOut ? 'check-out' : 'check-in';
      const locationName = siteLocation?.name || 'this location';
      
      const success = await biometricAuthService.authenticateForShift(action, locationName);
      setBiometricVerified(success);
      
      if (success) {
        Alert.alert('Verified', 'Biometric authentication successful.');
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'biometric_verification');
      Alert.alert('Error', 'Biometric verification failed. Please try again.');
    }
  };

  const validateRequirements = (): { isValid: boolean; message: string } => {
    // Check location validation
    if (locationValidation && !locationValidation.isValid) {
      return {
        isValid: false,
        message: `Location validation failed: ${locationValidation.message}`,
      };
    }

    // Check if photo is required and captured
    if (!capturedPhoto) {
      return {
        isValid: false,
        message: 'Photo verification is required for check-in/out.',
      };
    }

    // Check biometric verification
    if (!biometricVerified) {
      return {
        isValid: false,
        message: 'Biometric verification is required.',
      };
    }

    return { isValid: true, message: 'All requirements met.' };
  };

  const handleCheckIn = async () => {
    try {
      const validation = validateRequirements();
      if (!validation.isValid) {
        Alert.alert('Requirements Not Met', validation.message);
        return;
      }

      if (!currentLocationData || !shiftId) {
        Alert.alert('Error', 'Missing required data for check-in.');
        return;
      }

      const checkInData = {
        shiftId,
        location: {
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude,
          accuracy: currentLocationData.accuracy,
        },
        photoId: capturedPhoto?.id,
        timestamp: Date.now(),
        biometricVerified: true,
      };

      await dispatch(checkInToShift(checkInData) as any);
      
      // Send real-time update
      WebSocketService.sendShiftStatusUpdate({
        guardId: activeShift?.guardId || 'unknown',
        shiftId,
        status: 'ACTIVE',
        location: {
          guardId: activeShift?.guardId || 'unknown',
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude,
          accuracy: currentLocationData.accuracy,
          timestamp: currentLocationData.timestamp,
        },
      });

      setCheckInTime(new Date());
      
      Alert.alert(
        'Check-in Successful',
        'You have successfully checked in to your shift.',
        [
          {
            text: 'Start Shift',
            onPress: () => navigation.navigate('ActiveShift', { shiftId }),
          },
        ]
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'check_in_shift');
      Alert.alert('Error', 'Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const validation = validateRequirements();
      if (!validation.isValid) {
        Alert.alert('Requirements Not Met', validation.message);
        return;
      }

      if (!currentLocationData || !shiftId) {
        Alert.alert('Error', 'Missing required data for check-out.');
        return;
      }

      const checkOutData = {
        shiftId,
        location: {
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude,
          accuracy: currentLocationData.accuracy,
        },
        photoId: capturedPhoto?.id,
        timestamp: Date.now(),
        biometricVerified: true,
      };

      await dispatch(checkOutFromShift(checkOutData) as any);
      
      // Send real-time update
      WebSocketService.sendShiftStatusUpdate({
        guardId: activeShift?.guardId || 'unknown',
        shiftId,
        status: 'COMPLETED',
        location: {
          guardId: activeShift?.guardId || 'unknown',
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude,
          accuracy: currentLocationData.accuracy,
          timestamp: currentLocationData.timestamp,
        },
      });

      Alert.alert(
        'Check-out Successful',
        'You have successfully completed your shift.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back or to shift details if available
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Navigate to home or shift details
                try {
                  navigation.navigate('ShiftDetails' as never, { shiftId } as never);
                } catch (e) {
                  // If ShiftDetails doesn't exist, just go back to home
                  console.log('Navigation error:', e);
                }
              }
            },
          },
        ]
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'check_out_shift');
      Alert.alert('Error', 'Failed to check out. Please try again.');
    }
  };

  const getLocationStatusColor = () => {
    if (!locationValidation) return COLORS.textSecondary;
    return locationValidation.isValid ? COLORS.success : COLORS.error;
  };

  const getLocationStatusIcon = () => {
    if (!locationValidation) return MapPinIcon;
    return locationValidation.isValid ? CheckCircleIcon : XCircleIcon;
  };

  const renderLocationStatus = () => {
    const StatusIcon = getLocationStatusIcon();
    const statusColor = getLocationStatusColor();

    return (
      <AppCard style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <StatusIcon size={24} color={statusColor} />
          <Text style={[styles.statusTitle, { color: statusColor }]}>
            Location Status
          </Text>
          <TouchableOpacity onPress={handleRefreshLocation} disabled={isLoadingLocation}>
            <RefreshCwIcon 
              size={20} 
              color={isLoadingLocation ? COLORS.textSecondary : COLORS.primary} 
            />
          </TouchableOpacity>
        </View>

        {isLoadingLocation ? (
          <InlineLoading message="Validating location..." />
        ) : (
          <>
            {currentLocationData && (
              <View style={styles.locationDetails}>
                <Text style={styles.coordinatesText}>
                  {currentLocationData.latitude.toFixed(6)}, {currentLocationData.longitude.toFixed(6)}
                </Text>
                <Text style={styles.accuracyText}>
                  Accuracy: ±{currentLocationData.accuracy.toFixed(0)}m
                </Text>
              </View>
            )}

            {locationValidation && (
              <View style={styles.validationDetails}>
                <Text style={[styles.validationText, { color: statusColor }]}>
                  {locationValidation.message}
                </Text>
                {locationValidation.distance !== undefined && (
                  <Text style={styles.distanceText}>
                    Distance from site: {locationValidation.distance.toFixed(0)}m
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </AppCard>
    );
  };

  const renderPhotoCapture = () => (
    <AppCard style={styles.photoCard}>
      <View style={styles.photoHeader}>
        <CameraIcon size={24} color={capturedPhoto ? COLORS.success : COLORS.textSecondary} />
        <Text style={styles.photoTitle}>Photo Verification</Text>
        {capturedPhoto && <CheckCircleIcon size={20} color={COLORS.success} />}
      </View>

      {capturedPhoto ? (
        <View style={styles.capturedPhotoContainer}>
          <Image source={{ uri: capturedPhoto.uri }} style={styles.capturedPhoto} />
          <View style={styles.photoInfo}>
            <Text style={styles.photoFileName}>{capturedPhoto.fileName}</Text>
            <Text style={styles.photoTimestamp}>
              {new Date(capturedPhoto.timestamp).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity style={styles.retakeButton} onPress={handleTakePhoto}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.takePhotoButton} onPress={handleTakePhoto}>
          <CameraIcon size={32} color={COLORS.textInverse} />
          <Text style={styles.takePhotoButtonText}>Take Photo</Text>
        </TouchableOpacity>
      )}
    </AppCard>
  );

  const renderBiometricVerification = () => (
    <AppCard style={styles.biometricCard}>
      <View style={styles.biometricHeader}>
        <Text style={styles.biometricTitle}>Biometric Verification</Text>
        {biometricVerified && <CheckCircleIcon size={20} color={COLORS.success} />}
      </View>

      {biometricVerified ? (
        <View style={styles.verifiedContainer}>
          <CheckCircleIcon size={48} color={COLORS.success} />
          <Text style={styles.verifiedText}>Identity Verified</Text>
          <Text style={styles.verifiedSubtext}>Biometric authentication successful</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricVerification}>
          <Text style={styles.biometricButtonText}>Verify Identity</Text>
        </TouchableOpacity>
      )}
    </AppCard>
  );

  const renderActionButton = () => {
    const validation = validateRequirements();
    const isLoading = checkInLoading || checkOutLoading;
    const buttonText = isCheckOut ? 'Check Out' : 'Check In';
    const action = isCheckOut ? handleCheckOut : handleCheckIn;

    return (
      <TouchableOpacity
        style={[
          styles.actionButton,
          !validation.isValid && styles.actionButtonDisabled,
        ]}
        onPress={action}
        disabled={!validation.isValid || isLoading}
      >
        {isLoading ? (
          <InlineLoading message={`${buttonText}ing...`} color={COLORS.textInverse} />
        ) : (
          <>
            <ClockIcon size={24} color={COLORS.textInverse} />
            <Text style={styles.actionButtonText}>{buttonText}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen>
      <AppHeader 
        title={isCheckOut ? 'Check Out' : 'Check In'} 
        showBack 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {renderLocationStatus()}
        {renderPhotoCapture()}
        {renderBiometricVerification()}
        
        <View style={styles.actionContainer}>
          {renderActionButton()}
        </View>
      </ScrollView>

      <LoadingOverlay 
        visible={checkInLoading || checkOutLoading} 
        message={isCheckOut ? 'Checking out...' : 'Checking in...'} 
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  statusCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  locationDetails: {
    marginBottom: SPACING.sm,
  },
  coordinatesText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  validationDetails: {
    marginTop: SPACING.sm,
  },
  validationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  distanceText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  photoCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  photoTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  takePhotoButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: 12,
  },
  takePhotoButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  capturedPhotoContainer: {
    alignItems: 'center',
  },
  capturedPhoto: {
    width: screenWidth - 80,
    height: 200,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  photoInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  photoFileName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  photoTimestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  retakeButton: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retakeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  biometricCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  biometricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  biometricTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  biometricButton: {
    backgroundColor: COLORS.info,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  biometricButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  verifiedContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  verifiedText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
    marginTop: SPACING.sm,
  },
  verifiedSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  actionContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    elevation: 0,
    shadowOpacity: 0,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
});

export default EnhancedCheckInScreen;
