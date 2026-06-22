/**
 * Admin Dashboard - Main Admin Interface
 * Complete admin operations with streamlined navigation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchDashboardStats, fetchRecentActivity } from '../../store/slices/adminSlice';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { 
  UserIcon, 
  UsersIcon,
  LocationIcon, 
  ReportsIcon, 
  EmergencyIcon, 
  ShiftsIcon,
  SettingsIcon,
  MenuIcon,
} from '../../components/ui/AppIcons';
import { AppIcon } from '../../components/ui/AppIcons';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { ChevronRightIcon } from '../../components/ui/AppIcons';
import SharedHeader from '../../components/ui/SharedHeader';
import StatsCard from '../../components/ui/StatsCard';
import StatsGrid, { statCardStyle } from '../../components/ui/StatsGrid';
import QuickActionCard from '../../components/ui/QuickActionCard';
import RecentActivityCard from '../../components/ui/RecentActivityCard';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { RefreshControl } from 'react-native';
import EmergencyAlertsPanel from '../../components/emergency/EmergencyAlertsPanel';
import operationsService, { EmergencyAlert } from '../../services/operationsService';
import {
  applyAckCooldown,
  filterPendingEmergencyAlerts,
  getCooldownFromMessage,
  getRemainingCooldownSeconds,
  navigateToEmergencyAlertResponse,
} from '../../utils/emergencyAlertUtils';
import { useEmergencyRealtimeRefresh } from '../../hooks/useEmergencyRealtimeRefresh';
import { navigateToAdminSettingsTab } from '../../utils/tabNavigationHelpers';

const { width } = Dimensions.get('window');

interface AdminDashboardProps {
  navigation: any;
}

interface DashboardMetrics {
  totalGuards: number;
  activeGuards: number;
  totalSites: number;
  activeSites: number;
  todayIncidents: number;
  pendingIncidents: number;
  emergencyAlerts: number;
  scheduledShifts: number;
  revenue: number;
  clientSatisfaction: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: 'AdminNotifications',
  });
  
  // Redux state
  const { dashboardMetrics, dashboardLoading, dashboardError, recentActivity, activityLoading } = useSelector(
    (state: RootState) => state.admin
  );

  const [refreshing, setRefreshing] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [acknowledgingAlertId, setAcknowledgingAlertId] = useState<string | null>(null);
  const [ackCooldownUntilById, setAckCooldownUntilById] = useState<Record<string, number>>({});

  const loadEmergencyAlerts = useCallback(async () => {
    setEmergencyLoading(true);
    try {
      const alerts = await operationsService.getActiveEmergencyAlerts();
      setEmergencyAlerts(alerts);
    } catch (error) {
      console.error('Error loading emergency alerts:', error);
      setEmergencyAlerts([]);
    } finally {
      setEmergencyLoading(false);
    }
  }, []);

  const pendingEmergencyAlerts = useMemo(
    () => filterPendingEmergencyAlerts(emergencyAlerts),
    [emergencyAlerts],
  );

  useEmergencyRealtimeRefresh(loadEmergencyAlerts);

  const [quickActions] = useState([
    {
      id: 'operations',
      title: 'Operation Center',
      subtitle: 'Live Monitoring & alerts',
      icon: 'monitor',
      iconBgColor: '#DBEAFE',
      iconColor: '#1C6CA9',
      screen: 'AdminOperationsCenter',
    },
    {
      id: 'scheduling',
      title: 'Shift Scheduling',
      subtitle: 'Manage guard schedules',
      icon: 'calendar',
      iconBgColor: '#FCE7F3',
      iconColor: '#EC4899',
      screen: 'ShiftScheduling',
    },
    {
      id: 'users',
      title: 'User Management',
      subtitle: 'Guards, clients & admin',
      icon: 'users',
      iconBgColor: '#DCFCE7',
      iconColor: '#16A34A',
      screen: 'UserManagement',
    },
    {
      id: 'invitations',
      title: 'Invitations',
      subtitle: 'Create & manage invitations',
      icon: 'ticket',
      iconBgColor: '#FEF3C7',
      iconColor: '#F59E0B',
      screen: 'InvitationManagement',
    },
    {
      id: 'incidents',
      title: 'Incident Review',
      subtitle: 'Review and approve reports',
      icon: 'alert',
      iconBgColor: '#DBEAFE',
      iconColor: '#1C6CA9',
      screen: 'IncidentReview',
    },
    {
      id: 'sites',
      title: 'Site Management',
      subtitle: 'Location & Geofencing',
      icon: 'location',
      iconBgColor: '#DBEAFE',
      iconColor: '#1C6CA9',
      screen: 'SiteManagement',
    },
  ]);

  useEffect(() => {
    loadDashboardData();
    loadEmergencyAlerts();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        dispatch(fetchDashboardStats()),
        dispatch(fetchRecentActivity(10)),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDashboardStats()),
        dispatch(fetchRecentActivity(10)),
        loadEmergencyAlerts(),
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (action: any) => {
    navigation.navigate(action.screen);
  };

  const handleEmergencyAlert = (alertId: string) => {
    if (acknowledgingAlertId) {
      return;
    }

    const remaining = getRemainingCooldownSeconds(alertId, ackCooldownUntilById);
    if (remaining > 0) {
      Alert.alert('Please Wait', `You can retry this action in ${remaining} seconds.`);
      return;
    }

    Alert.alert(
      'Emergency Alert',
      'Acknowledge this emergency alert and dispatch assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dispatch',
          style: 'destructive',
          onPress: () => acknowledgeEmergency(alertId),
        },
      ],
    );
  };

  const acknowledgeEmergency = async (alertId: string) => {
    if (acknowledgingAlertId) {
      return;
    }

    setAcknowledgingAlertId(alertId);
    try {
      const result = await operationsService.acknowledgeEmergencyAlert(alertId);
      if (result.success) {
        const alreadyHandled = result.message?.toLowerCase().includes('already') ?? false;
        const responseCooldown = getCooldownFromMessage(result.message);
        applyAckCooldown(alertId, responseCooldown || (alreadyHandled ? 20 : 8), setAckCooldownUntilById);
        setEmergencyAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
        await loadEmergencyAlerts();
        Alert.alert(
          alreadyHandled ? 'Already Acknowledged' : 'Emergency Dispatched',
          alreadyHandled
            ? 'This emergency alert was already acknowledged.'
            : 'Emergency response has been dispatched.',
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to dispatch emergency response.');
      }
    } finally {
      setAcknowledgingAlertId(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Dispatch logout action - this will handle API call, storage cleanup, and navigation
              await dispatch(logoutUser()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <SharedHeader
      variant="admin"
      showLogo={true}
      onMenuPress={openDrawer}
      onNotificationPress={onNotificationPress}
      notificationCount={notificationCount}
      profileDrawer={
        <AdminProfileDrawer
          visible={isDrawerVisible}
          onClose={closeDrawer}
          onNavigateToOperations={() => {
            closeDrawer();
            navigation.navigate('AdminOperationsCenter');
          }}
          onNavigateToScheduling={() => {
            closeDrawer();
            navigation.navigate('ShiftScheduling');
          }}
          onNavigateToUserManagement={() => {
            closeDrawer();
            navigation.navigate('UserManagement');
          }}
          onNavigateToSiteManagement={() => {
            closeDrawer();
            navigation.navigate('SiteManagement');
          }}
          onNavigateToIncidentReview={() => {
            closeDrawer();
            navigation.navigate('IncidentReview');
          }}
          onNavigateToAnalytics={() => {
            closeDrawer();
            navigation.navigate('AdminAnalytics');
          }}
          onNavigateToSettings={() => {
            closeDrawer();
            navigateToAdminSettingsTab(navigation);
          }}
        />
      }
    />
  );

  const renderMetricsOverview = () => {
    if (!dashboardMetrics) {
      return null;
    }

    const guardsOnLeave = dashboardMetrics.totalGuards - dashboardMetrics.activeGuards;
    const inactiveSites = dashboardMetrics.totalSites - dashboardMetrics.activeSites;

    return (
      <StatsGrid contentStyle={styles.metricsGrid}>
        <StatsCard
          label="Active Guards"
          value={`${dashboardMetrics.activeGuards}/${dashboardMetrics.totalGuards}`}
          subLabel={guardsOnLeave > 0 ? `${guardsOnLeave} On Leave` : 'All Active'}
          icon={<UserIcon size={20} color={COLORS.success} />}
          variant="success"
          layout="vertical"
          style={statCardStyle}
        />

        <StatsCard
          label="Active Sites"
          value={`${dashboardMetrics.activeSites}/${dashboardMetrics.totalSites}`}
          subLabel={inactiveSites > 0 ? `${inactiveSites} Inactive` : 'All Operational'}
          icon={<LocationIcon size={20} color={COLORS.info} />}
          variant="info"
          layout="vertical"
          style={statCardStyle}
        />

        <StatsCard
          label="Today's Reports"
          value={dashboardMetrics.todayIncidents}
          subLabel={
            dashboardMetrics.pendingIncidents > 0
              ? `${dashboardMetrics.pendingIncidents} Pending`
              : 'All Reviewed'
          }
          icon={<ReportsIcon size={20} color={COLORS.textSecondary} />}
          variant="neutral"
          layout="vertical"
          style={statCardStyle}
        />

        <StatsCard
          label="Scheduled Shifts"
          value={dashboardMetrics.scheduledShifts}
          subLabel="This Week"
          icon={<ShiftsIcon size={20} color={COLORS.accent} />}
          variant="warning"
          layout="vertical"
          style={statCardStyle}
        />
      </StatsGrid>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.actionsList}>
        {quickActions.map((action) => {
          let iconComponent;
          switch (action.icon) {
            case 'monitor':
              // Operation Center: Professional dashboard/analytics icon for operations management
              iconComponent = <AppIcon type="material" name="dashboard" size={20} color={action.iconColor} />;
              break;
            case 'calendar':
              // Shift Scheduling: Calendar with clock
              iconComponent = <ShiftsIcon size={20} color={action.iconColor} />;
              break;
            case 'users':
              // User Management: People/users icon
              iconComponent = <UsersIcon size={20} color={action.iconColor} />;
              break;
            case 'alert':
              // Incident Review: Document/clipboard icon
              iconComponent = <ReportsIcon size={20} color={action.iconColor} />;
              break;
            case 'location':
              // Site Management: Location pin icon
              iconComponent = <LocationIcon size={20} color={action.iconColor} />;
              break;
            case 'ticket':
              // Invitation Management: Ticket icon
              iconComponent = <AppIcon type="material" name="confirmation-number" size={20} color={action.iconColor} />;
              break;
            default:
              iconComponent = <SettingsIcon size={20} color={action.iconColor} />;
          }
          
          return (
            <QuickActionCard
              key={action.id}
              title={action.title}
              subtitle={action.subtitle}
              icon={iconComponent}
              iconBgColor={action.iconBgColor}
              onPress={() => handleQuickAction(action)}
            />
          );
        })}
      </View>
    </View>
  );

  const renderRecentActivity = () => {
    if (!recentActivity || recentActivity.length === 0) {
      return (
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent activity</Text>
          </View>
        </View>
      );
    }

    const getIcon = (iconType: string, iconColor: string) => {
      switch (iconType) {
        case 'check-in':
          return <UserIcon size={20} color={iconColor} />;
        case 'check-out':
          return <ShiftsIcon size={20} color={iconColor} />;
        case 'schedule':
          return <ShiftsIcon size={20} color={iconColor} />;
        default:
          return <ReportsIcon size={20} color={iconColor} />;
      }
    };

    return (
      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <View style={styles.activityList}>
          {recentActivity.map((activity) => (
            <RecentActivityCard
              key={activity.id}
              text={activity.text}
              time={activity.time}
              icon={getIcon(activity.icon, activity.iconColor)}
              iconColor={activity.iconColor}
              shadowColor={activity.iconColor}
            />
          ))}
        </View>
      </View>
    );
  };

  // Error handling
  const isNetworkError = dashboardError?.toLowerCase().includes('network') || 
                         dashboardError?.toLowerCase().includes('timeout') ||
                         dashboardError?.toLowerCase().includes('connection');

  if (dashboardLoading && !dashboardMetrics) {
    return (
      <SafeAreaWrapper>
        {renderHeader()}
        <LoadingOverlay visible={true} message="Loading dashboard..." />
      </SafeAreaWrapper>
    );
  }

  if (dashboardError && !dashboardMetrics) {
    return (
      <SafeAreaWrapper>
        {renderHeader()}
        {isNetworkError ? (
          <NetworkError 
            onRetry={loadDashboardData}
          />
        ) : (
          <ErrorState 
            error={dashboardError}
            onRetry={loadDashboardData}
          />
        )}
      </SafeAreaWrapper>
    );
  }

  // Prepare sections for FlatList
  const renderEmergencyAlerts = () => (
    <View style={styles.emergencySection}>
      <EmergencyAlertsPanel
        alerts={pendingEmergencyAlerts}
        loading={emergencyLoading}
        title="Active Emergency"
        onAcknowledge={handleEmergencyAlert}
        onAlertPress={(alertId) => navigateToEmergencyAlertResponse(navigation, alertId)}
        acknowledgeLabel="Dispatch"
        acknowledgingAlertId={acknowledgingAlertId}
      />
    </View>
  );

  const sections = [
    { type: 'metrics', key: 'metrics' },
    { type: 'emergency', key: 'emergency' },
    { type: 'quickActions', key: 'quickActions' },
    { type: 'recentActivity', key: 'recentActivity' },
  ];

  const renderSectionItem = ({ item }: { item: { type: string; key: string } }) => {
    switch (item.type) {
      case 'metrics':
        return renderMetricsOverview();
      case 'emergency':
        return renderEmergencyAlerts();
      case 'quickActions':
        return renderQuickActions();
      case 'recentActivity':
        return renderRecentActivity();
      default:
        return null;
    }
  };

  return (
    <SafeAreaWrapper>
      {renderHeader()}
      
      <FlatList
        testID="admin-dashboard-screen"
        style={styles.content}
        data={sections}
        renderItem={renderSectionItem}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListFooterComponent={<View style={{ height: 20 }} />}
      />
      
      {dashboardLoading && <LoadingOverlay visible={true} message="Refreshing..." />}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  adminName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFF',
  },
  emergencyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  metricsContainer: {
    padding: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  emergencySection: {
    marginTop: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: (width - SPACING.md * 2 - 8) / 2,
    maxWidth: (width - SPACING.md * 2 - 8) / 2,
  },
  quickActionsContainer: {
    padding: SPACING.md,
  },
  actionsList: {
    gap: 0,
  },
  recentActivityContainer: {
    padding: SPACING.md,
  },
  activityList: {
    gap: 0,
  },
  emptyState: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default AdminDashboard;
