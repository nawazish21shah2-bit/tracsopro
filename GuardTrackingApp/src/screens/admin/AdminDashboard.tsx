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
  LocationIcon, 
  ReportsIcon, 
  EmergencyIcon, 
  ShiftsIcon,
  SettingsIcon,
  NotificationIcon,
  MenuIcon
} from '../../components/ui/AppIcons';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

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

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalGuards: 24,
    activeGuards: 18,
    totalSites: 12,
    activeSites: 10,
    todayIncidents: 3,
    pendingIncidents: 1,
    emergencyAlerts: 0,
    scheduledShifts: 32,
    revenue: 45600,
    clientSatisfaction: 4.8,
  });

  const [quickActions] = useState([
    {
      id: 'operations',
      title: 'Operations Center',
      subtitle: 'Live monitoring & alerts',
      icon: 'monitor',
      color: COLORS.primary,
      screen: 'AdminOperationsCenter',
    },
    {
      id: 'scheduling',
      title: 'Shift Scheduling',
      subtitle: 'Manage guard schedules',
      icon: 'calendar',
      color: COLORS.success,
      screen: 'ShiftScheduling',
    },
    {
      id: 'users',
      title: 'User Management',
      subtitle: 'Guards, clients & admins',
      icon: 'users',
      color: COLORS.info,
      screen: 'UserManagement',
    },
    {
      id: 'incidents',
      title: 'Incident Review',
      subtitle: 'Review & approve reports',
      icon: 'alert',
      color: COLORS.warning,
      screen: 'IncidentReview',
    },
    {
      id: 'sites',
      title: 'Site Management',
      subtitle: 'Locations & geofencing',
      icon: 'location',
      color: COLORS.error,
      screen: 'SiteManagement',
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      subtitle: 'Performance insights',
      icon: 'chart',
      color: '#9C27B0',
      screen: 'AdminAnalytics',
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
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.menuButton}>
          <MenuIcon size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.adminName}>Admin Dashboard</Text>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.notificationButton}>
          <NotificationIcon size={24} color="#FFF" />
          {metrics.emergencyAlerts > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{metrics.emergencyAlerts}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
          <EmergencyIcon size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <SettingsIcon size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMetricsOverview = () => (
    <View style={styles.metricsContainer}>
      <Text style={styles.sectionTitle}>Operations Overview</Text>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <UserIcon size={24} color={COLORS.primary} />
            <Text style={styles.metricValue}>
              {metrics.activeGuards}/{metrics.totalGuards}
            </Text>
          </View>
          <Text style={styles.metricLabel}>Active Guards</Text>
          <Text style={styles.metricTrend}>+2 from yesterday</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <LocationIcon size={24} color={COLORS.success} />
            <Text style={styles.metricValue}>
              {metrics.activeSites}/{metrics.totalSites}
            </Text>
          </View>
          <Text style={styles.metricLabel}>Active Sites</Text>
          <Text style={styles.metricTrend}>All operational</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <ReportsIcon size={24} color={COLORS.warning} />
            <Text style={styles.metricValue}>{metrics.todayIncidents}</Text>
          </View>
          <Text style={styles.metricLabel}>Today's Incidents</Text>
          <Text style={styles.metricTrend}>{metrics.pendingIncidents} pending</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <ShiftsIcon size={24} color={COLORS.info} />
            <Text style={styles.metricValue}>{metrics.scheduledShifts}</Text>
          </View>
          <Text style={styles.metricLabel}>Scheduled Shifts</Text>
          <Text style={styles.metricTrend}>This week</Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handleQuickAction(action)}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              {action.icon === 'monitor' && <EmergencyIcon size={24} color={action.color} />}
              {action.icon === 'calendar' && <ShiftsIcon size={24} color={action.color} />}
              {action.icon === 'users' && <UserIcon size={24} color={action.color} />}
              {action.icon === 'alert' && <ReportsIcon size={24} color={action.color} />}
              {action.icon === 'location' && <LocationIcon size={24} color={action.color} />}
              {action.icon === 'chart' && <SettingsIcon size={24} color={action.color} />}
            </View>
            
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            
            <View style={styles.actionArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.recentActivityContainer}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      <View style={styles.activityList}>
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <UserIcon size={16} color={COLORS.success} />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>John Smith checked in at Central Office</Text>
            <Text style={styles.activityTime}>2 minutes ago</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <ReportsIcon size={16} color={COLORS.warning} />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>New incident reported at Warehouse A</Text>
            <Text style={styles.activityTime}>15 minutes ago</Text>
          </View>
        </View>

        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <ShiftsIcon size={16} color={COLORS.info} />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>Sarah Johnson completed night shift</Text>
            <Text style={styles.activityTime}>1 hour ago</Text>
          </View>
        </View>
      </View>
    </View>
  );

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
    gap: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - SPACING.md * 3) / 2,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  metricTrend: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
  },
  quickActionsContainer: {
    padding: SPACING.md,
  },
  actionsGrid: {
    gap: SPACING.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  actionArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
  },
  recentActivityContainer: {
    padding: SPACING.md,
  },
  activityList: {
    gap: SPACING.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
});

export default AdminDashboard;
