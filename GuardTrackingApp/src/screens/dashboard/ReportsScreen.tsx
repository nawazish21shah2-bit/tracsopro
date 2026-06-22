// Reports Screen - Pixel Perfect Figma Implementation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';
import { RootState } from '../../store';
import { fetchActiveShift } from '../../store/slices/shiftSlice';
import { createReport, clearError } from '../../store/slices/shiftReportSlice';
import ReportsActionBar from '../../components/reports/ReportsActionBar';
import ReportFeedCard from '../../components/reports/ReportFeedCard';
import SectionHeader from '../../components/ui/SectionHeader';
import { useGuardReportsFeed, toIncidentDetailReport } from '../../hooks/useGuardReportsFeed';
import {
  getReportStatusColor,
  getReportStatusLabel,
} from '../../utils/reportUtils';
import { globalStyles, COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { MapPinIcon, FileTextIcon, ClockIcon } from '../../components/ui/FeatherIcons';
import { FeatherIcon } from '../../components/ui/FeatherIcons';
import { ReportType } from '../../types/shift.types';
import { LoadingOverlay, ErrorState, NetworkError, EmptyState, InlineLoading } from '../../components/ui/LoadingStates';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import ReportMediaPicker from '../../components/reports/ReportMediaPicker';
import { ReportMediaItem, uploadReportMediaItems } from '../../utils/reportMediaUtils';
import { incidentApi } from '../../services/api/incidentApi';
import FormInput from '../../components/common/FormInput';

type ReportsScreenNavigationProp = StackNavigationProp<GuardStackParamList, 'GuardTabs'>;

const ReportsScreen: React.FC = () => {
  const navigation = useNavigation<ReportsScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const [reportText, setReportText] = useState('');
  const [reportMedia, setReportMedia] = useState<ReportMediaItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const { 
    activeShift, 
    loading: shiftLoading, 
    error: shiftError 
  } = useSelector((state: RootState) => state.shifts);
  
  const {
    reports: unifiedReports,
    loading: feedLoading,
    error: feedError,
    refresh: refreshReportsFeed,
  } = useGuardReportsFeed(50);

  const reportsLoading = feedLoading;
  const reportsError = feedError;

  const { submitLoading } = useSelector((state: RootState) => state.shiftReports);
  const { user } = useSelector((state: RootState) => state.auth);
  const { notificationCount } = useNotificationBell({ refreshOnFocus: false });

  // Load data on mount
  useEffect(() => {
    initializeData();
  }, [dispatch]);

  const initializeData = async () => {
    try {
      await dispatch(fetchActiveShift() as any);
      await refreshReportsFeed();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      dispatch(clearError());
      await dispatch(fetchActiveShift() as any);
      await refreshReportsFeed();
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

    if (reportText.trim().length < 10) {
      Alert.alert('Error', 'Report must be at least 10 characters long');
      return;
    }

    try {
      await dispatch(createReport({
        shiftId: activeShift.id,
        reportType: ReportType.SHIFT,
        content: reportText.trim(),
      }) as any).unwrap();

      if (reportMedia.length > 0) {
        const uploaded = await uploadReportMediaItems(reportMedia);
        if (uploaded.length > 0) {
          await incidentApi.createIncidentReport({
            reportType: 'Shift Documentation',
            description: reportText.trim(),
            location: {
              name: activeShift.locationName || 'Shift site',
              address: activeShift.locationAddress || '',
            },
            mediaFiles: uploaded,
          });
        }
      }

      setReportText('');
      setReportMedia([]);
      Alert.alert('Success', 'Report submitted successfully');
      await refreshReportsFeed();
    } catch (error: any) {
      const errorMessage = error?.message || error?.payload || 'Failed to submit report. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };


  const handleNotificationPress = () => {
    navigation.navigate('Notifications' as never);
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

  const handleReportPress = (report: any) => {
    navigation.navigate('IncidentReportDetail', {
      report: toIncidentDetailReport(report),
    });
  };

  const renderCurrentShiftCard = () => {
    if (!activeShift) {
      return (
        <View style={styles.emptyShiftCard}>
          <EmptyState
            title="No active shift"
            message="Check in to a shift to submit reports and use emergency actions."
            icon={<ClockIcon size={40} color={COLORS.textTertiary} />}
          />
        </View>
      );
    }

    return (
      <View style={styles.currentShiftCard}>
        <SectionHeader title="Current Shift" subtitle="Submit your shift report below" />
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
          <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '18' }]}>
            <Text style={[styles.statusText, { color: COLORS.success }]}>Active</Text>
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

        <FormInput
          placeholder="Write shift report"
          multiline
          numberOfLines={4}
          value={reportText}
          onChangeText={setReportText}
          containerStyle={styles.reportInputContainer}
        />

        <ReportMediaPicker
          items={reportMedia}
          onChange={setReportMedia}
          shiftId={activeShift.id}
          maxItems={4}
          compact
          title="Attach photos"
          hint="Optional evidence with your shift report"
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

        <ReportsActionBar layout="stack" requireActiveShift showHeader={false} />
      </View>
    );
  };

  const renderSubmittedReports = () => {
    if (reportsLoading && unifiedReports.length === 0) {
      return (
        <InlineLoading size="large" message="Loading reports..." style={styles.loadingContainer} />
      );
    }

    if (unifiedReports.length === 0) {
      return (
        <View style={styles.submittedReportsContainer}>
          <SectionHeader title="Submitted Reports" subtitle="Your report history" />
          <EmptyState
            title="No reports yet"
            message="Shift and incident reports you submit will appear here."
            icon={<FileTextIcon size={40} color={COLORS.textTertiary} />}
          />
        </View>
      );
    }

    return (
      <View style={styles.submittedReportsContainer}>
        <SectionHeader
          title="Submitted Reports"
          subtitle={`${unifiedReports.length} report${unifiedReports.length !== 1 ? 's' : ''}`}
        />

        {unifiedReports.map((report) => (
          <ReportFeedCard
            key={`${report.source}-${report.id}`}
            locationName={report.locationName || 'Unknown Location'}
            locationAddress={report.locationAddress}
            source={report.source}
            title={report.title}
            description={report.description}
            statusLabel={getReportStatusLabel(report.status, report.source)}
            statusColor={getReportStatusColor(report.status)}
            submittedAt={report.submittedAt}
            onPress={() => handleReportPress(report)}
          />
        ))}
      </View>
    );
  };

  // Check for network errors
  const isNetworkError = reportsError?.toLowerCase().includes('network') || 
                         reportsError?.toLowerCase().includes('connection') ||
                         reportsError?.toLowerCase().includes('econnrefused') ||
                         reportsError?.toLowerCase().includes('enotfound');

  if (reportsError && unifiedReports.length === 0 && !reportsLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />
        <SharedHeader
          variant="guard"
          title="My Reports"
          onNotificationPress={handleNotificationPress}
          notificationCount={notificationCount}
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />
      <SharedHeader
        variant="guard"
        title="My Reports"
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
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
    backgroundColor: COLORS.backgroundSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  currentShiftCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
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
    backgroundColor: COLORS.primaryLight,
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
    marginBottom: SPACING.xs / 2,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  statusBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.success,
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
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  shiftTimeValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportInputContainer: {
    marginBottom: SPACING.lg,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
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
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  incidentButtonText: {
    color: COLORS.primaryDark,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '15',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
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
    marginBottom: SPACING.xxxxl * 2, // Space for bottom navigator
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
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
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
    flex: 1,
    flexWrap: 'wrap',
  },
  reportTypeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    marginLeft: SPACING.xs,
  },
  reportStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  reportTypeLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  reportTimestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  historyBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  historyBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primaryDark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emptyShiftCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
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
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

export default ReportsScreen;
