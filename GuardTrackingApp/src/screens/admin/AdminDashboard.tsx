/**
 * Admin Dashboard - Main Admin Interface
 * Complete admin operations with streamlined navigation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
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

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalGuards: 24,
    activeGuards: 22,
    totalSites: 12,
    activeSites: 10,
    todayIncidents: 6,
    pendingIncidents: 1,
    emergencyAlerts: 0,
    scheduledShifts: 32,
    revenue: 45600,
    clientSatisfaction: 4.8,
  });

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
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    // In real implementation, fetch from API
    // Simulated real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeGuards: prev.activeGuards + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0),
        todayIncidents: prev.todayIncidents + (Math.random() > 0.95 ? 1 : 0),
      }));
    }, 30000);

    return () => clearInterval(interval);
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
      onNotificationPress={() => {
        // Handle notification press
      }}
      notificationCount={metrics.emergencyAlerts}
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

  const renderMetricsOverview = () => (
    <View style={styles.metricsContainer}>
      <View style={styles.metricsGrid}>
        <AdminStatsCard
          label="Active Guards"
          value={`${metrics.activeGuards}/${metrics.totalGuards}`}
          subLabel="2 On Leave"
          icon={<UserIcon size={20} color="#16A34A" />}
          iconBgColor="#DCFCE7"
          iconColor="#16A34A"
          style={styles.statCard}
        />
        
        <AdminStatsCard
          label="Active Sites"
          value={`${metrics.activeSites}/${metrics.totalSites}`}
          subLabel="All Operational"
          icon={<LocationIcon size={20} color="#1976D2" />}
          iconBgColor="#DBEAFE"
          iconColor="#1976D2"
          style={styles.statCard}
        />
        
        <AdminStatsCard
          label="Today's Report"
          value={metrics.todayIncidents}
          subLabel="1 Pending"
          icon={<ReportsIcon size={20} color="#6B7280" />}
          iconBgColor="#F3F4F6"
          iconColor="#6B7280"
          style={styles.statCard}
        />
        
        <AdminStatsCard
          label="Scheduled Shifts"
          value={metrics.scheduledShifts}
          subLabel="This Week"
          icon={<ShiftsIcon size={20} color="#EC4899" />}
          iconBgColor="#FCE7F3"
          iconColor="#EC4899"
          style={styles.statCard}
        />
      </View>
    </View>
  );

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
    const activities = [
      {
        id: '1',
        text: 'John Smith checked in at Central Office',
        time: '2 minutes ago',
        icon: <UserIcon size={20} color="#16A34A" />,
        iconColor: '#16A34A',
        shadowColor: '#16A34A', // Green shadow for check-in
      },
      {
        id: '2',
        text: 'New incident reported at Warehouse A',
        time: '15 minutes ago',
        icon: <ReportsIcon size={20} color="#F59E0B" />,
        iconColor: '#F59E0B',
        shadowColor: '#F59E0B', // Orange shadow for incidents
      },
      {
        id: '3',
        text: 'Sarah Johnson completed night shift',
        time: '1 hour ago',
        icon: <ShiftsIcon size={20} color="#3B82F6" />,
        iconColor: '#3B82F6',
        shadowColor: '#3B82F6', // Blue shadow for shifts
      },
    ];

    return (
      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <View style={styles.activityList}>
          {activities.map((activity) => (
            <RecentActivityCard
              key={activity.id}
              text={activity.text}
              time={activity.time}
              icon={activity.icon}
              iconColor={activity.iconColor}
              shadowColor={activity.shadowColor}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaWrapper>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderMetricsOverview()}
        {renderQuickActions()}
        {renderRecentActivity()}
      </ScrollView>
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
    gap: 8,
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
});

export default AdminDashboard;
