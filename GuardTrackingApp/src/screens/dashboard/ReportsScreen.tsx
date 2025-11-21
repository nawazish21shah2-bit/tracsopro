// Reports Screen - Pixel Perfect Figma Implementation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../../store';
import { 
  fetchGuardReports, 
  createReport,
  clearError 
} from '../../store/slices/shiftReportSlice';
import { fetchActiveShift } from '../../store/slices/shiftSlice';
import { globalStyles, COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { MapPinIcon, AlertTriangleIcon, AlertCircleIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import { FeatherIcon } from '../../components/ui/FeatherIcons';
import { ReportType } from '../../types/shift.types';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';

type ReportsScreenNavigationProp = StackNavigationProp<any, 'Reports'>;

const ReportsScreen: React.FC = () => {
  const navigation = useNavigation<ReportsScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const [reportText, setReportText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const { 
    activeShift, 
    loading: shiftLoading, 
    error: shiftError 
  } = useSelector((state: RootState) => state.shifts);
  
  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
    submitLoading,
  } = useSelector((state: RootState) => state.shiftReports);

  const { user } = useSelector((state: RootState) => state.auth);

  // Load data on mount
  useEffect(() => {
    initializeData();
  }, [dispatch]);

  const initializeData = async () => {
    try {
      await Promise.all([
        dispatch(fetchActiveShift() as any),
        dispatch(fetchGuardReports(50) as any),
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      dispatch(clearError());
      await Promise.all([
        dispatch(fetchActiveShift() as any),
        dispatch(fetchGuardReports(50) as any),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim()) {
      Alert.alert('Error', 'Please write a report before submitting');
      return;
    }

    if (!activeShift) {
      Alert.alert('Error', 'No active shift found. Please check in to a shift first.');
      return;
    }

    try {
      await dispatch(createReport({
        shiftId: activeShift.id,
        reportType: ReportType.SHIFT,
        content: reportText.trim(),
      }) as any);
      
      setReportText('');
      Alert.alert('Success', 'Report submitted successfully');
      // Refresh reports list
      await dispatch(fetchGuardReports(50) as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    }
  };

  const handleAddIncidentReport = () => {
    navigation.navigate('AddIncidentReport');
  };

  const handleEmergencyAlert = () => {
    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to send an emergency alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Alert', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement emergency alert API call
            Alert.alert('Emergency Alert Sent', 'Help is on the way!');
          }
        },
      ]
    );
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const formatTime = (time?: string) => {
    if (!time) return '--:--';
    try {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }).toLowerCase().replace(' ', ' ');
    } catch {
      return time;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const getReportTypeLabel = (reportType: string) => {
    switch (reportType) {
      case 'INCIDENT':
        return 'Incident report';
      case 'EMERGENCY':
        return 'Emergency report';
      default:
        return 'Shift report';
    }
  };

  const renderCurrentShiftCard = () => {
    if (!activeShift) {
      return (
        <View style={styles.emptyShiftCard}>
          <Text style={styles.emptyShiftText}>No active shift</Text>
          <Text style={styles.emptyShiftSubtext}>Check in to a shift to submit reports</Text>
        </View>
      );
    }

    return (
      <View style={styles.currentShiftCard}>
        <View style={styles.locationHeader}>
          <View style={styles.locationInfo}>
            <View style={styles.locationIconCircle}>
              <MapPinIcon size={20} color={COLORS.primary} />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationName}>{activeShift.locationName || 'Unknown Location'}</Text>
              <Text style={styles.locationAddress}>{activeShift.locationAddress || 'No address'}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        {activeShift.description && (
          <Text style={styles.shiftDescription}>
            {activeShift.description}
          </Text>
        )}

        <View style={styles.shiftTimeRow}>
          <Text style={styles.shiftTimeLabel}>Shift Time:</Text>
          <Text style={styles.shiftTimeValue}>
            {formatTime(activeShift.startTime)} - {formatTime(activeShift.endTime)}
          </Text>
        </View>

        <TextInput
          style={styles.reportInput}
          placeholder="Write shift report"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={reportText}
          onChangeText={setReportText}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, submitLoading && styles.submitButtonDisabled]}
          onPress={handleSubmitReport}
          disabled={submitLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {submitLoading ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.incidentButton} 
            onPress={handleAddIncidentReport}
            activeOpacity={0.8}
          >
            <FileTextIcon size={16} color="#1E3A8A" />
            <Text style={styles.incidentButtonText}>Add Incident Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.emergencyButton} 
            onPress={handleEmergencyAlert}
            activeOpacity={0.8}
          >
            <AlertCircleIcon size={16} color={COLORS.error} />
            <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSubmittedReports = () => {
    if (reportsLoading && reports.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      );
    }

    if (reports.length === 0) {
      return (
        <View style={styles.emptyReportsContainer}>
          <Text style={styles.emptyReportsText}>No submitted reports</Text>
          <Text style={styles.emptyReportsSubtext}>Your submitted reports will appear here</Text>
        </View>
      );
    }

    return (
      <View style={styles.submittedReportsContainer}>
        <Text style={styles.sectionTitle}>Submitted Reports</Text>

        {reports.map((report) => {
          const shift = report.shift;
          // Get location from shift - shift has locationName and locationAddress directly
          const locationName = shift?.locationName || shift?.location?.name || 'Unknown Location';
          const locationAddress = shift?.locationAddress || shift?.location?.address || 'No address';

          return (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationInfo}>
                  <View style={styles.locationIconCircle}>
                    <MapPinIcon size={20} color={COLORS.textPrimary} />
                  </View>
                  <View style={styles.locationText}>
                    <Text style={styles.locationName}>{locationName}</Text>
                    <Text style={styles.locationAddress}>{locationAddress}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.reportText}>{report.content}</Text>

              <View style={styles.reportFooter}>
                <TouchableOpacity 
                  style={styles.reportType}
                  onPress={() => {
                    // TODO: Navigate to report details or show dropdown
                    console.log('Report type clicked:', report.id);
                  }}
                  activeOpacity={0.7}
                >
                  <FileTextIcon size={14} color="#1C6CA9" />
                  <Text style={styles.reportTypeText}>
                    {getReportTypeLabel(report.reportType)}
                  </Text>
                  <FeatherIcon name="chevronDown" size={12} color="#828282" />
                </TouchableOpacity>
                <Text style={styles.reportTime}>
                  {formatDate(report.submittedAt)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // Check for network errors
  const isNetworkError = reportsError?.toLowerCase().includes('network') || 
                         reportsError?.toLowerCase().includes('connection') ||
                         reportsError?.toLowerCase().includes('econnrefused') ||
                         reportsError?.toLowerCase().includes('enotfound');

  if (reportsError && reports.length === 0 && !reportsLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <SharedHeader
          variant="guard"
          title="My Reports"
          onNotificationPress={handleNotificationPress}
          profileDrawer={
            <GuardProfileDrawer
              visible={false}
              onClose={() => {}}
            />
          }
        />
        {isNetworkError ? (
          <NetworkError
            onRetry={initializeData}
            style={styles.errorContainer}
          />
        ) : (
          <ErrorState
            error={reportsError || 'An error occurred'}
            onRetry={initializeData}
            style={styles.errorContainer}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SharedHeader
        variant="guard"
        title="My Reports"
        onNotificationPress={handleNotificationPress}
        profileDrawer={
          <GuardProfileDrawer
            visible={false}
            onClose={() => {}}
          />
        }
      />
      
      <LoadingOverlay
        visible={shiftLoading && !activeShift}
        message="Loading shift data..."
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {renderCurrentShiftCard()}
        {renderSubmittedReports()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  currentShiftCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    // Drop shadow: X: 0, Y: 4, Blur: 4, Spread: 0, Color: #DCDCDC 25%
    shadowColor: '#DCDCDC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE', // Light blue background for icon
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#828282',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  statusBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: '#4CAF50',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  shiftDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  shiftTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  shiftTimeLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#828282',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  shiftTimeValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 12,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    backgroundColor: '#FAFAFA',
    marginBottom: SPACING.lg,
    minHeight: 115,
    textAlignVertical: 'top',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  submitButton: {
    backgroundColor: '#1C6CA9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    alignSelf: 'flex-end',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE', // Light blue background
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  incidentButtonText: {
    color: '#1E3A8A', // Dark blue text
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  emergencyButtonText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  submittedReportsContainer: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    // Drop shadow: X: 0, Y: 4, Blur: 4, Spread: 0, Color: #DCDCDC 25%
    shadowColor: '#DCDCDC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  reportText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  reportTypeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#1C6CA9',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#828282',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emptyShiftCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 12,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCDCDC',
  },
  emptyShiftText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emptyShiftSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#828282',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emptyReportsContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyReportsText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emptyReportsSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#828282',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#828282',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

export default ReportsScreen;
