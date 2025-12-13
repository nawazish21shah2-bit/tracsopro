/**
 * Admin Dashboard - Main Admin Interface
 * Complete admin operations with streamlined navigation
 */

import React, { useState, useEffect } from 'react';
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
import AdminStatsCard from '../../components/ui/AdminStatsCard';
import QuickActionCard from '../../components/ui/QuickActionCard';
import RecentActivityCard from '../../components/ui/RecentActivityCard';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { RefreshControl } from 'react-native';

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
  
  // Redux state
  const { dashboardMetrics, dashboardLoading, dashboardError, recentActivity, activityLoading } = useSelector(
    (state: RootState) => state.admin
  );

  const [refreshing, setRefreshing] = useState(false);

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

  const handleEmergencyAlert = () => {
    Alert.alert(
      'Emergency Protocol',
      'Activate emergency response protocol?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', style: 'destructive', onPress: () => console.log('Emergency activated') },
      ]
    );
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
      onNotificationPress={() => {
        // Handle notification press
      }}
      notificationCount={dashboardMetrics?.emergencyAlerts || 0}
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
            navigation.navigate('AdminSettings');
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
    
    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricsGrid}>
          <AdminStatsCard
            label="Active Guards"
            value={`${dashboardMetrics.activeGuards}/${dashboardMetrics.totalGuards}`}
            subLabel={guardsOnLeave > 0 ? `${guardsOnLeave} On Leave` : 'All Active'}
            icon={<UserIcon size={20} color={COLORS.success} />}
            iconBgColor="#DCFCE7"
            iconColor="#16A34A"
            style={styles.statCard}
          />
          
          <AdminStatsCard
            label="Active Sites"
            value={`${dashboardMetrics.activeSites}/${dashboardMetrics.totalSites}`}
            subLabel="All Operational"
            icon={<LocationIcon size={20} color={COLORS.info} />}
            iconBgColor="#DBEAFE"
            iconColor="#1976D2"
            style={styles.statCard}
          />
          
          <AdminStatsCard
            label="Today's Report"
            value={dashboardMetrics.todayIncidents}
            subLabel={dashboardMetrics.pendingIncidents > 0 ? `${dashboardMetrics.pendingIncidents} Pending` : 'All Reviewed'}
            icon={<ReportsIcon size={20} color={COLORS.textSecondary} />}
            iconBgColor="#F3F4F6"
            iconColor="#6B7280"
            style={styles.statCard}
          />
          
          <AdminStatsCard
            label="Scheduled Shifts"
            value={dashboardMetrics.scheduledShifts}
            subLabel="This Week"
            icon={<ShiftsIcon size={20} color={COLORS.accent} />}
            iconBgColor="#FCE7F3"
            iconColor="#EC4899"
            style={styles.statCard}
          />
        </View>
      </View>
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
  const sections = [
    { type: 'metrics', key: 'metrics' },
    { type: 'quickActions', key: 'quickActions' },
    { type: 'recentActivity', key: 'recentActivity' },
  ];

  const renderSectionItem = ({ item }: { item: { type: string; key: string } }) => {
    switch (item.type) {
      case 'metrics':
        return renderMetricsOverview();
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
