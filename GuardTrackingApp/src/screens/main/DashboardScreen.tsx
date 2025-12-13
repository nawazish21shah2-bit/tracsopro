// Enhanced Guard Dashboard Screen
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { fetchGuards } from '../../store/slices/guardSlice';
import { fetchIncidents } from '../../store/slices/incidentSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { UserRole } from '../../types';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useDebounce, useStableCallback } from '../../utils/performance';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { guards, isLoading: guardsLoading } = useSelector((state: RootState) => state.guards);
  const { incidents, isLoading: incidentsLoading } = useSelector((state: RootState) => state.incidents);
  const { notifications, isLoading: notificationsLoading } = useSelector((state: RootState) => state.notifications);

  const [refreshing, setRefreshing] = useState(false);

  // Memoize loading state
  const isLoading = useMemo(() => 
    guardsLoading || incidentsLoading || notificationsLoading, 
    [guardsLoading, incidentsLoading, notificationsLoading]
  );

  // Stable callback for loading data
  const loadDashboardData = useStableCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchGuards({ page: 1, limit: 5 })),
        dispatch(fetchIncidents({ page: 1, limit: 5 })),
        dispatch(fetchNotifications()),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    }
  });

  // Debounced refresh handler
  const debouncedRefresh = useDebounce(refreshing, 1000);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getDashboardStats = () => {
    const today = new Date().toDateString();
    const todayIncidents = incidents.filter(incident => 
      new Date(incident.reportedAt).toDateString() === today
    );
    
    return {
      totalGuards: guards.length,
      activeGuards: guards.filter(guard => guard.status === 'active').length,
      todayIncidents: todayIncidents.length,
      unreadNotifications: notifications.filter(notif => !notif.isRead).length,
    };
  };

  const stats = getDashboardStats();

  if (isLoading && !refreshing) {
    return <LoadingSpinner text="Loading dashboard..." overlay />;
  }

  return (
    <ErrorBoundary>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
      <SharedHeader
        variant="dashboard"
        title={`${getGreeting()}, ${user?.firstName} ${user?.lastName}`}
        onNotificationPress={() => {
          // Navigate to notifications based on user role
          const userRole = user?.role;
          if (userRole === 'CLIENT') {
            navigation.navigate('ClientNotifications' as never);
          } else if (userRole === 'ADMIN') {
            navigation.navigate('AdminNotifications' as never);
          } else if (userRole === 'SUPER_ADMIN') {
            navigation.navigate('SuperAdminNotifications' as never);
          } else {
            navigation.navigate('Notifications' as never);
          }
        }}
        notificationCount={stats.unreadNotifications}
      />

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalGuards}</Text>
          <Text style={styles.statLabel}>Total Guards</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeGuards}</Text>
          <Text style={styles.statLabel}>Active Guards</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.todayIncidents}</Text>
          <Text style={styles.statLabel}>Today's Incidents</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Button
            title="Report Incident"
            onPress={() => navigation.navigate('CreateIncident')}
            variant="primary"
            size="medium"
            icon="📝"
            style={styles.actionButton}
          />
          
          <Button
            title="Start Tracking"
            onPress={() => navigation.navigate('Tracking')}
            variant="success"
            size="medium"
            icon="📍"
            style={styles.actionButton}
          />
          
          <Button
            title="Messages"
            onPress={() => navigation.navigate('Messages')}
            variant="secondary"
            size="medium"
            icon="💬"
            style={styles.actionButton}
          />
          
          <Button
            title="Profile"
            onPress={() => navigation.navigate('Profile')}
            variant="secondary"
            size="medium"
            icon="👤"
            style={styles.actionButton}
          />
        </View>
      </View>

      {/* Recent Incidents */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Incidents</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Incidents')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {incidents.length > 0 ? (
          incidents.slice(0, 3).map((incident) => (
            <TouchableOpacity
              key={incident.id}
              style={styles.incidentCard}
              onPress={() => navigation.navigate('IncidentDetail', { incidentId: incident.id })}
            >
              <View style={styles.incidentHeader}>
                <Text style={styles.incidentType}>{incident.type}</Text>
                <Text style={[styles.severityBadge, { backgroundColor: getSeverityColor(incident.severity) }]}>
                  {incident.severity.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.incidentDescription} numberOfLines={2}>
                {incident.description}
              </Text>
              <Text style={styles.incidentTime}>
                {new Date(incident.reportedAt).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent incidents</Text>
          </View>
        )}
      </View>

      {/* Recent Guards */}
      {user?.role === UserRole.ADMIN ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Guards</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Guards')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {guards.length > 0 ? (
            guards.slice(0, 3).map((guard) => (
              <TouchableOpacity
                key={guard.id}
                style={styles.guardCard}
                onPress={() => navigation.navigate('GuardDetail', { guardId: guard.id })}
              >
                <View style={styles.guardInfo}>
                  <Text style={styles.guardName}>
                    {guard.userId} - {guard.department}
                  </Text>
                  <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(guard.status) }]}>
                    {guard.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.guardDepartment}>{guard.department}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No guards found</Text>
            </View>
          )}
        </View>
      ) : null}
      </ScrollView>
    </ErrorBoundary>
  );
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#FF4444';
    case 'high': return '#FF8800';
    case 'medium': return '#FFBB33';
    case 'low': return '#00C851';
    default: return '#6C757D';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return COLORS.success;
    case 'inactive': return COLORS.error;
    case 'suspended': return COLORS.warning;
    case 'terminated': return COLORS.textSecondary;
    default: return COLORS.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  notificationButton: {
    position: 'relative',
    padding: SPACING.sm,
  },
  notificationIcon: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  incidentCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  incidentType: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  incidentDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  incidentTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  guardCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  guardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  guardName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guardDepartment: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xxxxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textTertiary,
  },
});

export default DashboardScreen;
