import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Camera } from 'react-native-feather';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');

interface Assignment {
  id: string;
  shiftTitle: string;
  siteName: string;
  address: string;
  startTime: string;
  endTime: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

const CheckInOutScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { assignmentId } = route.params as { assignmentId: string };
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadAssignment();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      const result = await apiService.getShiftById(assignmentId);
      
      if (result.success && result.data) {
        const shift = result.data;
        setAssignment({
          id: assignmentId,
          shiftTitle: shift.title || shift.locationName || 'Security Shift',
          siteName: shift.locationName || shift.siteName || 'Site',
          address: shift.locationAddress || shift.address || '',
          startTime: shift.startTime || shift.scheduledStartTime,
          endTime: shift.endTime || shift.scheduledEndTime,
          status: shift.status === 'IN_PROGRESS' ? 'IN_PROGRESS' :
                 shift.status === 'COMPLETED' ? 'COMPLETED' : 'ASSIGNED',
          checkInTime: shift.checkInTime || shift.actualStartTime,
          checkOutTime: shift.checkOutTime || shift.actualEndTime,
          notes: shift.notes || ''
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to load assignment details');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!assignment) return;

    setProcessing(true);
    try {
      // Get current location
      let location = {
        latitude: 0,
        longitude: 0,
        accuracy: 10,
        address: 'Current location'
      };

      try {
        const { Geolocation } = require('react-native');
        const position = await new Promise<any>((resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        location.latitude = position.coords.latitude;
        location.longitude = position.coords.longitude;
        location.accuracy = position.coords.accuracy || 10;
      } catch (locError) {
        console.warn('Could not get location:', locError);
        Alert.alert('Location Error', 'Could not get your location. Check-in will proceed without location data.');
      }

      const result = await apiService.checkInToShift(assignmentId, location);
      
      if (result.success) {
        // Update local state
        setAssignment(prev => prev ? {
          ...prev,
          status: 'IN_PROGRESS',
          checkInTime: new Date().toISOString(),
          notes: notes
        } : null);

        Alert.alert('Success', result.message || 'You have successfully checked in to your shift!');
        setNotes('');
      } else {
        Alert.alert('Error', result.message || 'Failed to check in. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check in. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!assignment) return;

    setProcessing(true);
    try {
      // Get current location
      let location = {
        latitude: 0,
        longitude: 0,
        accuracy: 10,
        address: 'Current location'
      };

      try {
        const { Geolocation } = require('react-native');
        const position = await new Promise<any>((resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        location.latitude = position.coords.latitude;
        location.longitude = position.coords.longitude;
        location.accuracy = position.coords.accuracy || 10;
      } catch (locError) {
        console.warn('Could not get location:', locError);
        Alert.alert('Location Error', 'Could not get your location. Check-out will proceed without location data.');
      }

      const result = await apiService.checkOutFromShift(assignmentId, location, notes);
      
      if (result.success) {
        // Update local state
        setAssignment(prev => prev ? {
          ...prev,
          status: 'COMPLETED',
          checkOutTime: new Date().toISOString(),
          notes: prev.notes ? `${prev.notes}\n\nCheck-out: ${notes}` : notes
        } : null);

        Alert.alert(
          'Shift Completed',
          result.message || 'You have successfully checked out. Thank you for your service!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to check out. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check out. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isWithinShiftTime = () => {
    if (!assignment) return false;
    const now = new Date();
    const shiftStart = new Date(assignment.startTime);
    const shiftEnd = new Date(assignment.endTime);
    const thirtyMinutesEarly = new Date(shiftStart.getTime() - 30 * 60 * 1000);
    
    return now >= thirtyMinutesEarly && now <= shiftEnd;
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <Text>Loading assignment...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <Text>Assignment not found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const canCheckIn = assignment.status === 'ASSIGNED' && isWithinShiftTime();
  const canCheckOut = assignment.status === 'IN_PROGRESS';
  const isCompleted = assignment.status === 'COMPLETED';

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft width={24} height={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCompleted ? 'Shift Completed' : canCheckOut ? 'Check Out' : 'Check In'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Current Time */}
        <View style={styles.timeContainer}>
          <Text style={styles.currentTimeLabel}>Current Time</Text>
          <Text style={styles.currentTime}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
          <Text style={styles.currentDate}>
            {currentTime.toLocaleDateString()}
          </Text>
        </View>

        {/* Assignment Details */}
        <View style={styles.section}>
          <Text style={styles.shiftTitle}>{assignment.shiftTitle}</Text>
          <Text style={styles.siteName}>{assignment.siteName}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MapPin width={16} height={16} color="#666" />
              <Text style={styles.detailText}>{assignment.address}</Text>
            </View>

            <View style={styles.detailRow}>
              <Clock width={16} height={16} color="#666" />
              <Text style={styles.detailText}>
                {formatTime(assignment.startTime)} - {formatTime(assignment.endTime)}
              </Text>
            </View>
          </View>

          {/* Status Information */}
          <View style={styles.statusContainer}>
            {assignment.checkInTime && (
              <View style={styles.statusRow}>
                <CheckCircle width={16} height={16} color="#28A745" />
                <Text style={styles.statusText}>
                  Checked in: {formatDateTime(assignment.checkInTime)}
                </Text>
              </View>
            )}
            
            {assignment.checkOutTime && (
              <View style={styles.statusRow}>
                <XCircle width={16} height={16} color="#DC3545" />
                <Text style={styles.statusText}>
                  Checked out: {formatDateTime(assignment.checkOutTime)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes Section */}
        {!isCompleted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {canCheckOut ? 'Check-out Notes' : 'Check-in Notes'}
            </Text>
            <Text style={styles.notesHint}>
              {canCheckOut 
                ? 'Add any final notes about your shift completion'
                : 'Add any notes about your arrival or observations'
              }
            </Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={canCheckOut ? "Shift completed successfully..." : "Arrived on time, all secure..."}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Previous Notes */}
        {assignment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shift Notes</Text>
            <Text style={styles.previousNotes}>{assignment.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {!isCompleted && (
          <View style={styles.actionContainer}>
            {canCheckIn && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.checkInButton, processing && styles.actionButtonDisabled]}
                onPress={handleCheckIn}
                disabled={processing}
              >
                <CheckCircle width={20} height={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {processing ? 'Checking In...' : 'Check In'}
                </Text>
              </TouchableOpacity>
            )}

            {canCheckOut && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.checkOutButton, processing && styles.actionButtonDisabled]}
                onPress={handleCheckOut}
                disabled={processing}
              >
                <XCircle width={20} height={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {processing ? 'Checking Out...' : 'Check Out'}
                </Text>
              </TouchableOpacity>
            )}

            {!canCheckIn && !canCheckOut && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  {assignment.status === 'ASSIGNED' 
                    ? 'You can check in 30 minutes before your shift starts'
                    : 'Please check in first to access check-out'
                  }
                </Text>
              </View>
            )}
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedContainer}>
            <CheckCircle width={48} height={48} color="#28A745" />
            <Text style={styles.completedText}>Shift Completed Successfully</Text>
            <Text style={styles.completedSubtext}>Thank you for your service!</Text>
          </View>
        )}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  currentTimeLabel: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    opacity: 0.8,
    marginBottom: SPACING.sm,
  },
  currentTime: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xxxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
  },
  currentDate: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    opacity: 0.9,
  },
  section: {
    backgroundColor: COLORS.backgroundPrimary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  shiftTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  siteName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  detailsContainer: {
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailText: {
    marginLeft: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusContainer: {
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusText: {
    marginLeft: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  notesHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundPrimary,
    height: 100,
  },
  previousNotes: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  checkInButton: {
    backgroundColor: COLORS.success,
  },
  checkOutButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  actionButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
  infoContainer: {
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  infoText: {
    color: COLORS.warningDark,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completedText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  completedSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default CheckInOutScreen;
