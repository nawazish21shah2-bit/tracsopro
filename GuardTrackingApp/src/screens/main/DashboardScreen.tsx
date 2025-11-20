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
        onNotificationPress={() => navigation.navigate('Messages')}
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
    case 'active': return '#00C851';
    case 'inactive': return '#FF4444';
    case 'suspended': return '#FF8800';
    case 'terminated': return '#6C757D';
    default: return '#6C757D';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#007AFF',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#E3F2FD',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
  },
  incidentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  incidentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  incidentTime: {
    fontSize: 12,
    color: '#999',
  },
  guardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  guardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guardDepartment: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
});

export default DashboardScreen;
