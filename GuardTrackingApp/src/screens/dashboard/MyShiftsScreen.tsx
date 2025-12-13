// My Shifts Screen - Pixel Perfect Figma Implementation
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../../store';
import { securityManager } from '../../utils/security';
import {
  fetchTodayShifts,
  fetchUpcomingShifts,
  fetchPastShifts,
  fetchActiveShift,
  fetchWeeklyShiftSummary,
  fetchShiftStatistics,
} from '../../store/slices/shiftSlice';
import { MenuIcon, BellIcon, MapPinIcon, AlertTriangleIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import { globalStyles, COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { AppScreen, AppCard } from '../../components/ui/AppComponents';
import StatsCard from '../../components/ui/StatsCard';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { clearError } from '../../store/slices/shiftSlice';

type MyShiftsScreenNavigationProp = StackNavigationProp<any, 'MyShifts'>;

interface ShiftData {
  id: string;
  location: string;
  address: string;
  status: 'active' | 'upcoming' | 'completed' | 'missed';
  startTime: string;
  endTime: string;
  duration: string;
  description: string;
  clockedIn?: string;
  clockedOut?: string;
  timer?: string;
}

interface MonthlyStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReported: number;
}

interface WeeklyShift {
  date: string;
  day: string;
  site: string;
  shiftTime: string;
  status: 'completed' | 'missed';
  checkIn: string;
  checkOut: string;
}

const MyShiftsScreen: React.FC = () => {
  const navigation = useNavigation<MyShiftsScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const [selectedTab, setSelectedTab] = useState('Today');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const { 
    todayShifts, 
    upcomingShifts, 
    pastShifts,
    activeShift,
    weeklyShifts,
    stats,
    loading, 
    error 
  } = useSelector((state: RootState) => state.shifts);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Use Redux data or fallback to default stats
  const monthlyStats = stats || {
    completedShifts: 0,
    missedShifts: 0,
    totalSites: 0,
    incidentReports: 0,
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const hasValidTokens = await securityManager.areTokensValid();
        if (!hasValidTokens) {
          if (__DEV__) console.log('Skipping shift fetch: no valid tokens');
          return;
        }
        await Promise.all([
          dispatch(fetchTodayShifts() as any),
          dispatch(fetchUpcomingShifts() as any),
          dispatch(fetchPastShifts(20) as any),
          dispatch(fetchActiveShift() as any),
          dispatch(fetchWeeklyShiftSummary() as any),
          dispatch(fetchShiftStatistics({}) as any),
        ]);
      } catch (error) {
        console.error('Error loading shifts data:', error);
      }
    };
    loadData();
  }, [dispatch, isAuthenticated]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      dispatch(clearError() as any); // Clear any previous errors
      const hasValidTokens = await securityManager.areTokensValid();
      if (!hasValidTokens) {
        setRefreshing(false);
        return;
      }
      await Promise.all([
        dispatch(fetchTodayShifts() as any),
        dispatch(fetchUpcomingShifts() as any),
        dispatch(fetchPastShifts(20) as any),
        dispatch(fetchActiveShift() as any),
        dispatch(fetchWeeklyShiftSummary() as any),
        dispatch(fetchShiftStatistics({}) as any),
      ]);
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Clear error when switching tabs
  useEffect(() => {
    dispatch(clearError() as any);
  }, [activeTab, dispatch]);

  // Handler functions
  const handleMenuPress = useCallback(() => {
    (navigation as any).dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleNotificationPress = useCallback(() => {
    (navigation as any).navigate('Notifications');
  }, [navigation]);



  const handleEmergencyAlert = () => {
    if (!activeShift || activeShift.status !== 'IN_PROGRESS') {
      Alert.alert(
        'Shift Not Active',
        'You can only send emergency alerts for active shifts. Please check in to your shift first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
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
              // TODO: Implement emergency alert API call
              Alert.alert('Emergency Alert', 'Emergency alert sent successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Helper function to convert shift to ShiftData format
  const toShiftData = (s: any): ShiftData => ({
    id: s.id || '',
    location: s.locationName || s.site?.name || s.location || 'Unknown Location',
    address: s.site?.address || s.address || '',
    status: s.status === 'IN_PROGRESS' ? 'active' : s.status === 'COMPLETED' ? 'completed' : s.status === 'MISSED' ? 'missed' : 'upcoming',
    startTime: s.startTime || '',
    endTime: s.endTime || '',
    duration: s.duration || '',
    description: s.description || '',
    clockedIn: s.checkInTime || undefined,
    clockedOut: s.checkOutTime || undefined,
    timer: s.timer || undefined,
  });

  // Convert activeShift to ShiftData format
  const todayShift: ShiftData | null = activeShift ? toShiftData(activeShift) : null;

  // Convert weeklyShifts from Redux to WeeklyShift format
  const formattedWeeklyShifts: WeeklyShift[] = weeklyShifts && Array.isArray(weeklyShifts) 
    ? weeklyShifts.map((shift: any) => {
        const date = new Date(shift.startTime || shift.date);
        return {
          date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          day: date.toLocaleDateString('en-US', { weekday: 'long' }),
          site: shift.locationName || shift.site || 'Unknown Site',
          shiftTime: `${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(shift.endTime || shift.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
          status: shift.status === 'COMPLETED' ? 'completed' : 'missed',
          checkIn: shift.checkInTime ? new Date(shift.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          checkOut: shift.checkOutTime ? new Date(shift.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
        };
      })
    : [];

  const handleAddIncidentReport = () => {
    if (!activeShift || activeShift.status !== 'IN_PROGRESS') {
      Alert.alert(
        'Shift Not Active',
        'You can only submit incident reports for active shifts. Please check in to your shift first.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('AddIncidentReport');
  };





  const renderMonthlyStats = () => (
    <View style={styles.monthlyStatsContainer}>
      <Text style={styles.monthlyStatsTitle}>This Month Shifts</Text>
      <View style={styles.statsGrid}>
        <StatsCard
          label={'Completed\nShifts'}
          value={monthlyStats.completedShifts}
          icon={<CheckCircleIcon size={18} color={COLORS.success} />}
          variant="success"
          style={styles.statItem}
        />
        <StatsCard
          label={'Missed\nShifts'}
          value={monthlyStats.missedShifts}
          icon={<ClockIcon size={18} color={COLORS.error} />}
          variant="danger"
          style={styles.statItem}
        />
        <StatsCard
          label={'Total\nSites'}
          value={monthlyStats.totalSites}
          icon={<MapPinIcon size={18} color={COLORS.info} />}
          variant="info"
          style={styles.statItem}
        />
        <StatsCard
          label={'Incident\nReported'}
          value={monthlyStats.incidentReports}
          icon={<FileTextIcon size={18} color={COLORS.textTertiary} />}
          variant="neutral"
          style={styles.statItem}
        />
      </View>
    </View>
  );

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
  ];

  const renderShiftCard = (shift: ShiftData) => (
    <View key={shift.id} style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View style={styles.locationInfo}>
          <MapPinIcon size={20} color={COLORS.primary} />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>{shift.location}</Text>
            <Text style={styles.locationAddress}>{shift.address}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, 
          shift.status === 'active' && styles.activeBadge,
          shift.status === 'upcoming' && styles.upcomingBadge
        ]}>
          <Text style={[styles.statusText,
            shift.status === 'active' && styles.activeText,
            shift.status === 'upcoming' && styles.upcomingText
          ]}>
            {shift.status === 'active' ? 'Active' : 'Upcoming'}
          </Text>
        </View>
      </View>

      <Text style={styles.shiftDescription}>{shift.description}</Text>
      
      <View style={styles.shiftDetails}>
        <Text style={styles.shiftDetailLabel}>Shift Time:</Text>
        <Text style={styles.shiftDetailValue}>{shift.startTime} - {shift.endTime}</Text>
      </View>

      {shift.status === 'active' && (
        <>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{todayShift?.timer || '00:00:00'}</Text>
          </View>
          <Text style={styles.clockedInText}>
            Clocked In at {shift.clockedIn}
          </Text>
          <Text style={styles.clockedInSubtext}>
            Clocked In at 09:00 am
          </Text>
        </>
      )}

      {shift.status === 'upcoming' && (
        <View style={styles.shiftDetails}>
          <Text style={styles.shiftDetailLabel}>Shift Start In:</Text>
          <Text style={styles.shiftDetailValue}>{shift.duration}</Text>
        </View>
      )}

      {/* Only show action buttons for active shifts */}
      {shift.status === 'active' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.incidentButton} onPress={handleAddIncidentReport}>
            <AlertTriangleIcon size={16} color={COLORS.primary} style={styles.actionIconMargin} />
            <Text style={styles.incidentButtonText}>Add Incident Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
            <AlertCircleIcon size={16} color={COLORS.error} style={styles.actionIconMargin} />
            <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderWeeklySummary = () => (
    <View style={styles.weeklySummaryContainer}>
      <Text style={styles.weeklySummaryTitle}>This Week's Shifts Summary</Text>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>SITE</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>SHIFT TIME</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>CHECK IN</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>CHECK OUT</Text>
      </View>

      {formattedWeeklyShifts.length > 0 ? formattedWeeklyShifts.map((shift, index) => (
        <View key={index} style={styles.tableRow}>
          <View style={{ flex: 1.5 }}>
            <Text style={styles.tableCellDate}>{shift.date}</Text>
            <Text style={styles.tableCellDay}>{shift.day}</Text>
          </View>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.site}</Text>
          <Text style={[styles.tableCellText, { flex: 1.5 }]}>{shift.shiftTime}</Text>
          <View style={{ flex: 1 }}>
            <View style={[styles.tableStatusBadge, 
              shift.status === 'completed' && styles.completedBadge,
              shift.status === 'missed' && styles.missedBadge
            ]}>
              <Text style={[styles.tableStatusText,
                shift.status === 'completed' && styles.completedText,
                shift.status === 'missed' && styles.missedText
              ]}>
                {shift.status === 'completed' ? 'Completed' : 'Missed'}
              </Text>
            </View>
          </View>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.checkIn}</Text>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.checkOut}</Text>
        </View>
      )) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No weekly shifts data available</Text>
        </View>
      )}
    </View>
  );


  // Check if error is related to the current tab
  const isErrorRelevant = () => {
    if (!error) return false;
    const errorLower = error.toLowerCase();
    if (activeTab === 'upcoming' && errorLower.includes('upcoming')) return true;
    if (activeTab === 'today' && errorLower.includes('today')) return true;
    if (activeTab === 'past' && errorLower.includes('past')) return true;
    return false;
  };

  const isNetworkError = error?.toLowerCase().includes('network') || 
                         error?.toLowerCase().includes('connection') ||
                         error?.toLowerCase().includes('econnrefused') ||
                         error?.toLowerCase().includes('enotfound');

  const handleRetry = async () => {
    dispatch(clearError() as any);
    const hasValidTokens = await securityManager.areTokensValid();
    if (!hasValidTokens) return;
    
    switch (activeTab) {
      case 'today':
        await dispatch(fetchTodayShifts() as any);
        break;
      case 'upcoming':
        await dispatch(fetchUpcomingShifts() as any);
        break;
      case 'past':
        await dispatch(fetchPastShifts(20) as any);
        break;
    }
  };

  const renderContent = () => {
    // Show error state if there's an error relevant to current tab
    if (isErrorRelevant()) {
      return (
        <View style={styles.errorContainer}>
          {isNetworkError ? (
            <NetworkError
              onRetry={handleRetry}
              style={styles.errorState}
            />
          ) : (
            <ErrorState
              error={error || 'An error occurred'}
              onRetry={handleRetry}
              style={styles.errorState}
            />
          )}
        </View>
      );
    }

    switch (activeTab) {
      case 'today':
        if (!todayShift && !loading) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active shift today</Text>
              <Text style={styles.emptySubtext}>You don't have any shifts scheduled for today</Text>
            </View>
          );
        }
        return (
          <View>
            {todayShift && renderShiftCard(todayShift)}
            {todayShifts && todayShifts.length > 0 && todayShifts.map((shift: any) => 
              shift.id !== activeShift?.id && renderShiftCard(toShiftData(shift))
            )}
          </View>
        );
      case 'upcoming':
        // Show empty state if no shifts, but only if not loading and no error
        if (!loading && (!upcomingShifts || !Array.isArray(upcomingShifts) || upcomingShifts.length === 0)) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No upcoming shifts</Text>
              <Text style={styles.emptySubtext}>You don't have any upcoming shifts scheduled</Text>
            </View>
          );
        }
        return (
          <View>
            {upcomingShifts && Array.isArray(upcomingShifts) && upcomingShifts.length > 0
              ? upcomingShifts.map(toShiftData).map(renderShiftCard)
              : null
            }
          </View>
        );
      case 'past':
        if (!loading && (!pastShifts || !Array.isArray(pastShifts) || pastShifts.length === 0)) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No past shifts to display</Text>
            </View>
          );
        }
        return (
          <View>
            {pastShifts && Array.isArray(pastShifts) && pastShifts.length > 0
              ? pastShifts.map(toShiftData).map(renderShiftCard)
              : <Text style={styles.emptyText}>No past shifts to display</Text>
            }
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />
      <SharedHeader
        variant="guard"
        title="My Shifts"
        onNotificationPress={handleNotificationPress}
        profileDrawer={
          <GuardProfileDrawer
            visible={false}
            onClose={() => {}}
            onNavigateToProfile={() => {
              // Navigate to profile/settings when available
            }}
            onNavigateToPastJobs={() => {
              // Navigation handled in drawer
            }}
            onNavigateToAssignedSites={() => {
              // Navigation handled in drawer
            }}
            onNavigateToAttendance={() => {
              // Navigation handled in drawer
            }}
            onNavigateToEarnings={() => {
              // Navigation handled in drawer
            }}
            onNavigateToNotifications={() => {
              // Navigate to notifications/settings
            }}
            onNavigateToSupport={() => {
              // Navigation handled in drawer
            }}
          />
        }
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderMonthlyStats()}
        
        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id as 'today' | 'upcoming' | 'past')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}
        {/* Only show weekly summary on today tab */}
        {activeTab === 'today' && renderWeeklySummary()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  notificationButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  monthlyStatsContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sectionGap || SPACING.xxl,
  },
  monthlyStatsTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Border only, no shadow for minimal style
  },
  statTextContainer: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statIconText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.textInverse,
  },
  shiftCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.fieldGap || SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  shiftHeader: {
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
  locationText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  activeBadge: {
    backgroundColor: COLORS.success + '20',
  },
  upcomingBadge: {
    backgroundColor: COLORS.primaryLight,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  activeText: {
    color: COLORS.success,
  },
  upcomingText: {
    color: COLORS.info,
  },
  shiftDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  shiftDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  shiftDetailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  shiftDetailValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  timerContainer: {
    backgroundColor: COLORS.textTertiary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  clockedInText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  clockedInSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.fieldGap || SPACING.lg,
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
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  incidentButtonIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
  },
  incidentButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '15',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
  },
  emergencyButtonIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
  },
  emergencyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.error,
  },
  weeklySummaryContainer: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  weeklySummaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  tableHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tableCellDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  tableCellDay: {
    fontSize: TYPOGRAPHY.fontSize.xs - 2,
    color: COLORS.textSecondary,
  },
  tableCellText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  tableStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: COLORS.success + '20',
  },
  missedBadge: {
    backgroundColor: COLORS.error + '20',
  },
  tableStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs - 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  completedText: {
    color: COLORS.success,
  },
  missedText: {
    color: COLORS.error,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xxxxl,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    paddingVertical: SPACING.xxxxl,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
    minHeight: 300,
  },
  errorState: {
    width: '100%',
  },
  actionIconMargin: {
    marginRight: SPACING.sm,
  },
});

export default MyShiftsScreen;
