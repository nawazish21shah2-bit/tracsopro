// Guard Dashboard Home Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../../store';
import {
  fetchShiftStatistics,
  fetchActiveShift,
  fetchUpcomingShifts,
} from '../../store/slices/shiftSlice';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { AppScreen, AppCard, AppStatGrid } from '../../components/ui/AppComponents';
import StatsCard from '../../components/ui/StatsCard';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { LoadingOverlay, ErrorState, NetworkError, InlineLoading } from '../../components/ui/LoadingStates';
import { ErrorHandler, withRetry } from '../../utils/errorHandler';
import Logo from '../../assets/images/tracSOpro-logo.png';
import {
  MenuIcon,
  BellIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  UserIcon
} from '../../components/ui/FeatherIcons';

type GuardHomeScreenNavigationProp = StackNavigationProp<any, 'GuardHome'>;

interface ShiftData {
  id: string;
  location: string;
  address: string;
  status: 'active' | 'upcoming' | 'completed';
  startTime: string;
  endTime: string;
  duration: string;
  description: string;
  clockedIn?: string;
  clockedOut?: string;
}

interface StatsData {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReports: number;
}

interface NotificationData {
  id: string;
  user: string;
  avatar: string;
  action: string;
  time: string;
  site: string;
  status: 'active' | 'inactive';
}

const GuardHomeScreen: React.FC = () => {
  const navigation = useNavigation<GuardHomeScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  
  // Redux state
  const { 
    statistics, 
    activeShift, 
    upcomingShifts, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.shifts);
  
  // Use Redux data or fallback to mock data
  const stats = statistics || {
    completedShifts: 21,
    missedShifts: 1,
    totalSites: 5,
    incidentReports: 2,
  };

  const [todayShift] = useState<ShiftData>({
    id: '1',
    location: 'Ocean View Vila',
    address: '1321 Baker Street, NY',
    status: 'active',
    startTime: '08:00 am',
    endTime: '07:00 pm',
    duration: '10 min',
    description: 'Make sure to check the parking lot for illegal parkings.',
    clockedIn: '08:01 am',
  });

  const [upcomingShift] = useState<ShiftData>({
    id: '2',
    location: 'Ocean View Vila',
    address: '1321 Baker Street, NY',
    status: 'upcoming',
    startTime: '08:00 am',
    endTime: '07:00 pm',
    duration: '10 hrs',
    description: 'Make sure to check the parking lot for illegal parkings.',
  });

  const [notifications] = useState<NotificationData[]>([
    {
      id: '1',
      user: 'Mark Husdon',
      avatar: '👤',
      action: 'Checked In at 08:12 am',
      time: '2 min ago',
      site: 'Site Alpha',
      status: 'active',
    },
    {
      id: '2',
      user: 'Mark Husdon',
      avatar: '👤',
      action: 'Sent a incident report',
      time: '5 min ago',
      site: 'Site Alpha',
      status: 'active',
    },
    {
      id: '3',
      user: 'Mark Husdon',
      avatar: '👤',
      action: 'Sent a incident report',
      time: '10 min ago',
      site: 'Site Alpha',
      status: 'active',
    },
  ]);

  // Timer for active shift
  useEffect(() => {
    // Initialize data on component mount
    initializeData();

    // Timer for current time
    const timer = setInterval(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const initializeData = async () => {
    try {
      // Fetch all necessary data with retry logic
      await withRetry(async () => {
        await Promise.all([
          dispatch(fetchActiveShift() as any),
          dispatch(fetchUpcomingShifts() as any),
        ]);
      }, 3, 1000);
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_dashboard_data');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await initializeData();
    } catch (error) {
      ErrorHandler.handleError(error, 'refresh_dashboard_data', false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleCheckIn = () => {
    // Navigate to check-in screen or handle check-in logic
    console.log('Check In pressed');
  };

  const handleViewLocation = () => {
    // Navigate to location view
    console.log('View Location pressed');
  };

  const handleIncidentReport = () => {
    // Navigate to incident report screen
    navigation.navigate('AddIncidentReport');
  };

  const handleEmergencyAlert = () => {
    // Handle emergency alert
    console.log('Emergency Alert pressed');
  };

  const handleMenuPress = () => {
    // Open global drawer menu
    (navigation as any).dispatch(DrawerActions.openDrawer());
  };

  const handleNotificationPress = () => {
    // Handle notification press
    console.log('Notification pressed');
  };

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      {/* <Text style={styles.sectionTitle}>This Month Shifts</Text> */}
      <AppStatGrid style={styles.statsGrid}>
        <StatsCard
          label="Completed Shifts"
          value={stats.completedShifts}
          icon={<CheckCircleIcon size={18} color={COLORS.success} />}
          variant="success"
          style={styles.statCard}
        />
        <StatsCard
          label="Missed Shifts"
          value={stats.missedShifts}
          icon={<AlertTriangleIcon size={18} color={COLORS.error} />}
          variant="danger"
          style={styles.statCard}
        />
        <StatsCard
          label="Total Sites"
          value={stats.totalSites}
          icon={<MapPinIcon size={18} color={COLORS.info} />}
          variant="info"
          style={styles.statCard}
        />
        <StatsCard
          label="Incident Reported"
          value={stats.incidentReports}
          icon={<AlertTriangleIcon size={18} color={COLORS.textSecondary} />}
          variant="neutral"
          style={styles.statCard}
        />
      </AppStatGrid>
    </View>
  );

  const renderTodayShift = () => (
    <View style={styles.shiftSection}>
      <Text style={styles.sectionTitle}>Today's Shifts</Text>
      <AppCard style={styles.shiftCard}>
        <View style={styles.shiftHeader}>
          <View style={styles.locationInfo}>
            <View style={styles.locationIconContainer}>
            <MapPinIcon size={20} color={COLORS.primary} style={styles.locationIcon} />
            </View>
            <View>
              <Text style={styles.locationName}>{todayShift.location}</Text>
              <Text style={styles.locationAddress}>{todayShift.address}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.viewLocationButton} onPress={handleViewLocation}>
            <Text style={styles.viewLocationText}>View Location</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.shiftDescription}>{todayShift.description}</Text>
        
        <View style={styles.shiftDetails}>
          <View style={styles.shiftDetailRow}>
            <Text style={styles.shiftDetailLabel}>Shift Duration:</Text>
            <Text style={styles.shiftDetailValue}>{todayShift.startTime} - {todayShift.endTime}</Text>
          </View>
          <View style={styles.shiftDetailRow}>
            <Text style={styles.shiftDetailLabel}>Break Time:</Text>
            <Text style={styles.shiftDetailValue}>02:00 pm - 03:00 pm</Text>
          </View>
          <View style={styles.shiftDetailRow}>
            <Text style={styles.shiftDetailLabel}>Shift Start In:</Text>
            <Text style={styles.shiftDetailValue}>{todayShift.duration}</Text>
          </View>
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{currentTime}</Text>
        </View>

        <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
          <ClockIcon size={24} color={COLORS.textInverse} style={styles.checkInIcon} />
          <Text style={styles.checkInText}>Check In</Text>
        </TouchableOpacity>

        {todayShift.clockedIn && (
          <View style={styles.clockedInfo}>
            <Text style={styles.clockedText}>Clocked In at {todayShift.clockedIn}</Text>
            <Text style={styles.clockedSubtext}>Clocked In at 09:00 am</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.incidentButton} onPress={handleIncidentReport}>
            <AlertTriangleIcon size={20} color={COLORS.textInverse} style={styles.incidentIcon} />
            <Text style={styles.incidentText}>Add Incident Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
            <AlertCircleIcon size={20} color={COLORS.textInverse} style={styles.emergencyIcon} />
            <Text style={styles.emergencyText}>Emergency Alert</Text>
          </TouchableOpacity>
        </View>
      </AppCard>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.notificationsSection}>
      <Text style={styles.sectionTitle}>Today's Notifications</Text>
      {notifications.map((notification) => (
        <View key={notification.id} style={styles.notificationItem}>
          <View style={styles.notificationAvatar}>
            <UserIcon size={24} color={COLORS.textPrimary} />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationUser}>{notification.user}</Text>
            <Text style={styles.notificationAction}>{notification.action}</Text>
            <Text style={styles.notificationSite}>{notification.site}</Text>
          </View>
          <View style={styles.notificationStatus}>
            <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
      ))}
    </View>
  );

  // Show error state if there's an error and no data
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  // Check if it's a network error
  const isNetworkError = error?.toLowerCase().includes('network') || 
                         error?.toLowerCase().includes('connection') ||
                         error?.toLowerCase().includes('econnrefused') ||
                         error?.toLowerCase().includes('enotfound');

  if (error && !activeShift && !upcomingShifts?.length) {
    return (
      <AppScreen>
        <SharedHeader
          variant="guard"
          showLogo={true}
          onNotificationPress={handleNotificationPress}
          profileDrawer={
            <GuardProfileDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onNavigateToProfile={() => {
                closeDrawer();
                // Navigate to profile/settings when available
              }}
              onNavigateToPastJobs={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToAssignedSites={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToAttendance={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToEarnings={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToNotifications={() => {
                closeDrawer();
                // Navigate to notifications/settings
              }}
              onNavigateToSupport={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
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
            error={error}
            onRetry={initializeData}
            style={styles.errorContainer}
          />
        )}
      </AppScreen>
    );
  }

  return (
    <AppScreen>
        <SharedHeader
          variant="guard"
          showLogo={true}
          onNotificationPress={handleNotificationPress}
          profileDrawer={
            <GuardProfileDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onNavigateToProfile={() => {
                closeDrawer();
                // Navigate to profile/settings when available
              }}
              onNavigateToPastJobs={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToAssignedSites={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToAttendance={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToEarnings={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToNotifications={() => {
                closeDrawer();
                // Navigate to notifications/settings
              }}
              onNavigateToSupport={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
            />
          }
        />
      
      {/* Loading overlay for initial load */}
      <LoadingOverlay
        visible={loading && !activeShift && !upcomingShifts?.length}
        message="Loading dashboard..."
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && (activeShift || upcomingShifts?.length) ? (
          <InlineLoading message="Updating data..." style={styles.inlineLoading} />
        ) : null}
        
        {renderStatsSection()}
        {renderTodayShift()}
        {renderNotifications()}
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textPrimary,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  brandText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  logoImage: {
    width: 120,
    height: 30,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  statsSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  shiftSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  shiftCard: {
    padding: SPACING.lg,
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
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginTop: 4,
  },
  locationIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  viewLocationButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  viewLocationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  shiftDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  shiftDetails: {
    marginBottom: SPACING.lg,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  shiftDetailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  shiftDetailValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  timerContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  checkInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
  },
  checkInIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.sm,
  },
  checkInText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  clockedInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  clockedText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  clockedSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  incidentIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
  },
  incidentText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  emergencyIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
  },
  emergencyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  notificationsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  notificationContent: {
    flex: 1,
  },
  notificationUser: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  notificationAction: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  notificationSite: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  notificationStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  inlineLoading: {
    marginVertical: SPACING.md,
  },
});

export default GuardHomeScreen;
