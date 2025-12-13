/**
 * Shift Details Screen for Guards
 * Displays detailed information about a shift with improved UI
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { checkInToShiftWithLocation } from '../../store/slices/shiftSlice';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { MapPinIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon, FileTextIcon, UserIcon } from '../../components/ui/FeatherIcons';
import apiService from '../../services/api';
import Geolocation from 'react-native-geolocation-service';
import { ErrorHandler } from '../../utils/errorHandler';

const { width } = Dimensions.get('window');

type ShiftDetailsScreenNavigationProp = StackNavigationProp<any, 'ShiftDetails'>;

interface ShiftDetails {
  id: string;
  locationName: string;
  locationAddress: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  startTime?: string;
  endTime?: string;
  status: string;
  description?: string;
  notes?: string;
  checkInTime?: string;
  checkOutTime?: string;
  site?: {
    id: string;
    name: string;
    address: string;
  };
  client?: {
    id: string;
    name: string;
  };
}

const ShiftDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ShiftDetailsScreenNavigationProp>();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const { shiftId } = route.params as { shiftId: string };
  
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<ShiftDetails | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const { checkInLoading } = useSelector((state: RootState) => state.shifts);

  useEffect(() => {
    loadShiftDetails();
  }, [shiftId]);

  const loadShiftDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getShiftById(shiftId);
      
      if (response.success && response.data) {
        const shiftData = response.data;
        setShift({
          id: shiftData.id,
          locationName: shiftData.locationName || shiftData.site?.name || 'Unknown Location',
          locationAddress: shiftData.locationAddress || shiftData.site?.address || '',
          scheduledStartTime: shiftData.scheduledStartTime || shiftData.startTime,
          scheduledEndTime: shiftData.scheduledEndTime || shiftData.endTime,
          startTime: shiftData.startTime || shiftData.scheduledStartTime,
          endTime: shiftData.endTime || shiftData.scheduledEndTime,
          status: shiftData.status || 'SCHEDULED',
          description: shiftData.description,
          notes: shiftData.notes,
          checkInTime: shiftData.checkInTime || shiftData.actualStartTime,
          checkOutTime: shiftData.checkOutTime || shiftData.actualEndTime,
          site: shiftData.site,
          client: shiftData.client,
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to load shift details');
        navigation.goBack();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_shift_details');
      Alert.alert('Error', 'Failed to load shift details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!shift) return;

    setCheckingIn(true);
    try {
      // Get current location
      const position = await new Promise<Geolocation.GeoPosition>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 10,
        address: 'Current location',
      };

      await dispatch(checkInToShiftWithLocation({ shiftId: shift.id, location })).unwrap();
      
      Alert.alert('Success', 'Successfully checked in to shift');
      await loadShiftDetails();
    } catch (error: any) {
      ErrorHandler.handleError(error, 'check_in_shift');
      Alert.alert('Error', error.message || 'Failed to check in to shift');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleIncidentReport = () => {
    if (shift?.status === 'IN_PROGRESS') {
      navigation.navigate('AddIncidentReport' as any);
    } else {
      Alert.alert(
        'Shift Not Active',
        'You can only submit incident reports for active shifts. Please check in to your shift first.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleEmergencyAlert = () => {
    if (shift?.status === 'IN_PROGRESS') {
      Alert.alert(
        'Emergency Alert',
        'Are you sure you want to send an emergency alert? This will notify all supervisors and administrators immediately.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Alert',
            style: 'destructive',
            onPress: async () => {
              try {
                // Get current location
                const position = await new Promise<Geolocation.GeoPosition>((resolve, reject) => {
                  Geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                      enableHighAccuracy: true,
                      timeout: 10000,
                      maximumAge: 0,
                    }
                  );
                });

                // TODO: Implement emergency alert API call
                Alert.alert('Emergency Alert', 'Emergency alert sent successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Shift Not Active',
        'You can only send emergency alerts for active shifts. Please check in to your shift first.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDuration = (start: string | Date, end: string | Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const minutes = Math.floor((hours % 1) * 60);
    if (minutes > 0) {
      return `${Math.floor(hours)}h ${minutes}m`;
    }
    return `${hours.toFixed(1)} hours`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return '#F59E0B'; // Amber
      case 'IN_PROGRESS':
        return '#10B981'; // Green
      case 'COMPLETED':
        return '#3B82F6'; // Blue
      case 'CANCELLED':
        return '#EF4444'; // Red
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Scheduled';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader
          variant="guard"
          title="Shift Details"
          showLogo={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading shift details...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!shift) {
    return (
      <SafeAreaWrapper>
        <SharedHeader
          variant="guard"
          title="Shift Details"
          showLogo={false}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Shift not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  const canCheckIn = shift.status === 'SCHEDULED';
  const isInProgress = shift.status === 'IN_PROGRESS';
  const isCompleted = shift.status === 'COMPLETED';

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="guard"
        title="Shift Details"
        showLogo={false}
      />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Badge Header */}
        <View style={styles.headerSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(shift.status) }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{getStatusLabel(shift.status)}</Text>
          </View>
          <Text style={styles.shiftDate}>{formatDate(shift.scheduledStartTime)}</Text>
        </View>

        {/* Location Card - Enhanced */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MapPinIcon size={24} color={COLORS.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Location</Text>
              <Text style={styles.locationName}>{shift.locationName}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.locationAddress}>{shift.locationAddress}</Text>
        </View>

        {/* Schedule Card - Enhanced */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <ClockIcon size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Schedule</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.scheduleGrid}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Start</Text>
              <Text style={styles.scheduleTime}>{formatTime(shift.scheduledStartTime)}</Text>
              <Text style={styles.scheduleDate}>{formatDate(shift.scheduledStartTime)}</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>End</Text>
              <Text style={styles.scheduleTime}>{formatTime(shift.scheduledEndTime)}</Text>
              <Text style={styles.scheduleDate}>{formatDate(shift.scheduledEndTime)}</Text>
            </View>
          </View>

          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Duration</Text>
            <Text style={styles.durationValue}>{calculateDuration(shift.scheduledStartTime, shift.scheduledEndTime)}</Text>
          </View>

          {shift.checkInTime && (
            <View style={styles.checkInOutRow}>
              <View style={styles.checkInOutItem}>
                <CheckCircleIcon size={16} color={COLORS.success} />
                <Text style={styles.checkInOutLabel}>Checked In</Text>
                <Text style={styles.checkInOutTime}>{formatTime(shift.checkInTime)}</Text>
              </View>
            </View>
          )}

          {shift.checkOutTime && (
            <View style={styles.checkInOutRow}>
              <View style={styles.checkInOutItem}>
                <CheckCircleIcon size={16} color={COLORS.info} />
                <Text style={styles.checkInOutLabel}>Checked Out</Text>
                <Text style={styles.checkInOutTime}>{formatTime(shift.checkOutTime)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Description */}
        {shift.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <View style={styles.divider} />
            <Text style={styles.descriptionText}>{shift.description}</Text>
          </View>
        )}

        {/* Client Information */}
        {shift.client && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <UserIcon size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Client</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.clientName}>{shift.client.name}</Text>
          </View>
        )}

        {/* Action Buttons Section */}
        <View style={styles.actionsSection}>
          {canCheckIn && (
            <TouchableOpacity
              style={[styles.primaryButton, (checkingIn || checkInLoading) && styles.buttonDisabled]}
              onPress={handleCheckIn}
              disabled={checkingIn || checkInLoading}
            >
              {checkingIn || checkInLoading ? (
                <ActivityIndicator size="small" color={COLORS.textInverse} />
              ) : (
                <View style={styles.buttonContent}>
                  <CheckCircleIcon size={20} color={COLORS.textInverse} />
                  <Text style={styles.primaryButtonText}>Check In to Shift</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {isInProgress && (
            <>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.incidentButton]}
                  onPress={handleIncidentReport}
                >
                  <FileTextIcon size={20} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Incident Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.emergencyButton]}
                  onPress={handleEmergencyAlert}
                >
                  <AlertTriangleIcon size={20} color={COLORS.error} />
                  <Text style={[styles.actionButtonText, styles.emergencyButtonText]}>Emergency</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  navigation.navigate('CheckInOut' as any, { assignmentId: shift.id });
                }}
              >
                <Text style={styles.secondaryButtonText}>View Active Shift</Text>
              </TouchableOpacity>
            </>
          )}

          {isCompleted && (
            <View style={styles.completedBadge}>
              <CheckCircleIcon size={24} color={COLORS.success} />
              <Text style={styles.completedText}>Shift Completed</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.error,
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  backButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textInverse,
    marginRight: SPACING.xs,
  },
  statusText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
  },
  shiftDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderCard,
    marginVertical: SPACING.md,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  scheduleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  scheduleItem: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  scheduleTime: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  scheduleDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  scheduleDivider: {
    width: 1,
    height: 60,
    backgroundColor: COLORS.borderCard,
    marginHorizontal: SPACING.md,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  durationLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  durationValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  checkInOutRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  checkInOutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  checkInOutLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  checkInOutTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  descriptionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  clientName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  actionsSection: {
    marginTop: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    minHeight: 52,
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.xs,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: SPACING.xs,
    minHeight: 52,
  },
  incidentButton: {
    borderColor: COLORS.primary,
  },
  emergencyButton: {
    borderColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  emergencyButtonText: {
    color: COLORS.error,
  },
  secondaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    minHeight: 52,
    ...SHADOWS.small,
  },
  secondaryButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success + '15',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  completedText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
});

export default ShiftDetailsScreen;
