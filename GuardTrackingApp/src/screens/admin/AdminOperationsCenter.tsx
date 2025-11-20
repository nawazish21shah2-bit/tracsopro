/**
 * Admin Operations Center - Phase 6
 * Live guard monitoring, emergency alerts, and comprehensive operations management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import WebSocketService from '../../services/WebSocketService';
import InteractiveMapView from '../../components/client/InteractiveMapView';
import LiveActivityFeed from '../../components/client/LiveActivityFeed';
import { ErrorHandler } from '../../utils/errorHandler';
import { ReportsIcon, UserIcon, EmergencyIcon, SettingsIcon } from '../../components/ui/AppIcons';

interface GuardStatus {
  guardId: string;
  guardName: string;
  status: 'active' | 'on_break' | 'offline' | 'emergency';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  currentSite: string;
  shiftStart: number;
  lastUpdate: number;
  batteryLevel?: number;
  emergencyAlert?: {
    id: string;
    timestamp: number;
    message: string;
    acknowledged: boolean;
  };
}

interface OperationsMetrics {
  totalGuards: number;
  activeGuards: number;
  guardsOnBreak: number;
  offlineGuards: number;
  emergencyAlerts: number;
  siteCoverage: number;
  averageResponseTime: number;
  incidentsToday: number;
}

interface AdminOperationsCenterProps {
  navigation: any;
}

const AdminOperationsCenter: React.FC<AdminOperationsCenterProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [guardStatuses, setGuardStatuses] = useState<GuardStatus[]>([]);
  const [operationsMetrics, setOperationsMetrics] = useState<OperationsMetrics | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'guards' | 'alerts' | 'analytics'>('overview');
  const [isLiveMode, setIsLiveMode] = useState(true);

  useEffect(() => {
    initializeOperationsCenter();
    setupRealTimeUpdates();

    return () => {
      // Cleanup
    };
  }, []);

  const initializeOperationsCenter = async () => {
    try {
      await loadGuardStatuses();
      await loadOperationsMetrics();
      await loadEmergencyAlerts();
      
      console.log('🏢 Admin Operations Center initialized');
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_operations_center');
    }
  };

  const setupRealTimeUpdates = () => {
    // Setup WebSocket listeners for real-time updates
    const interval = setInterval(() => {
      if (isLiveMode) {
        updateGuardStatuses();
        updateOperationsMetrics();
      }
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  };

  const loadGuardStatuses = async () => {
    // Mock guard statuses
    const mockGuardStatuses: GuardStatus[] = [
      {
        guardId: 'guard_1',
        guardName: 'John Smith',
        status: 'active',
        location: {
          latitude: 40.7589,
          longitude: -73.9851,
          accuracy: 5,
          timestamp: Date.now(),
        },
        currentSite: 'Central Office',
        shiftStart: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
        lastUpdate: Date.now() - 30000, // 30 seconds ago
        batteryLevel: 85,
      },
      {
        guardId: 'guard_2',
        guardName: 'Sarah Johnson',
        status: 'emergency',
        location: {
          latitude: 40.7505,
          longitude: -73.9934,
          accuracy: 8,
          timestamp: Date.now(),
        },
        currentSite: 'Warehouse A',
        shiftStart: Date.now() - 3 * 60 * 60 * 1000,
        lastUpdate: Date.now() - 60000,
        batteryLevel: 42,
        emergencyAlert: {
          id: 'alert_1',
          timestamp: Date.now() - 120000, // 2 minutes ago
          message: 'Emergency button pressed - requires immediate assistance',
          acknowledged: false,
        },
      },
      {
        guardId: 'guard_3',
        guardName: 'Mike Wilson',
        status: 'on_break',
        location: {
          latitude: 40.7614,
          longitude: -73.9776,
          accuracy: 12,
          timestamp: Date.now(),
        },
        currentSite: 'Retail Store',
        shiftStart: Date.now() - 2 * 60 * 60 * 1000,
        lastUpdate: Date.now() - 45000,
        batteryLevel: 67,
      },
    ];

    setGuardStatuses(mockGuardStatuses);
  };

  const loadOperationsMetrics = async () => {
    const mockMetrics: OperationsMetrics = {
      totalGuards: 12,
      activeGuards: 8,
      guardsOnBreak: 2,
      offlineGuards: 2,
      emergencyAlerts: 1,
      siteCoverage: 94.2,
      averageResponseTime: 8.5,
      incidentsToday: 3,
    };

    setOperationsMetrics(mockMetrics);
  };

  const loadEmergencyAlerts = async () => {
    const mockAlerts = [
      {
        id: 'alert_1',
        guardId: 'guard_2',
        guardName: 'Sarah Johnson',
        type: 'emergency_button',
        message: 'Emergency button pressed - requires immediate assistance',
        timestamp: Date.now() - 120000,
        location: { latitude: 40.7505, longitude: -73.9934 },
        acknowledged: false,
        severity: 'critical',
      },
    ];

    setEmergencyAlerts(mockAlerts);
  };

  const updateGuardStatuses = () => {
    setGuardStatuses(prev => prev.map(guard => ({
      ...guard,
      lastUpdate: Date.now(),
      // Simulate small location changes for active guards
      location: guard.status === 'active' ? {
        ...guard.location,
        latitude: guard.location.latitude + (Math.random() - 0.5) * 0.0001,
        longitude: guard.location.longitude + (Math.random() - 0.5) * 0.0001,
        timestamp: Date.now(),
      } : guard.location,
    })));
  };

  const updateOperationsMetrics = () => {
    if (operationsMetrics) {
      setOperationsMetrics(prev => ({
        ...prev!,
        averageResponseTime: prev!.averageResponseTime + (Math.random() - 0.5) * 0.5,
        siteCoverage: Math.min(100, prev!.siteCoverage + (Math.random() - 0.5) * 2),
      }));
    }
  };

  const handleEmergencyAlert = (alertId: string) => {
    Alert.alert(
      'Emergency Alert',
      'Acknowledge this emergency alert and dispatch assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge & Dispatch',
          style: 'destructive',
          onPress: () => acknowledgeEmergency(alertId),
        },
      ]
    );
  };

  const acknowledgeEmergency = (alertId: string) => {
    setEmergencyAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
    
    setGuardStatuses(prev => prev.map(guard => 
      guard.emergencyAlert?.id === alertId 
        ? { ...guard, emergencyAlert: { ...guard.emergencyAlert, acknowledged: true } }
        : guard
    ));

    Alert.alert('Emergency Acknowledged', 'Emergency services have been dispatched.');
  };

  const getGuardStatusColor = (status: GuardStatus['status']) => {
    switch (status) {
      case 'active': return COLORS.success;
      case 'on_break': return COLORS.warning;
      case 'offline': return COLORS.textSecondary;
      case 'emergency': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const formatDuration = (startTime: number): string => {
    const duration = Date.now() - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const renderOperationsOverview = () => (
    <View style={styles.overviewContainer}>
      {/* Metrics Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{operationsMetrics?.activeGuards || 0}</Text>
          <Text style={styles.metricLabel}>Active Guards</Text>
          <View style={[styles.statusIndicator, { backgroundColor: COLORS.success }]} />
        </View>
        
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: COLORS.error }]}>
            {operationsMetrics?.emergencyAlerts || 0}
          </Text>
          <Text style={styles.metricLabel}>Emergency Alerts</Text>
          <View style={[styles.statusIndicator, { backgroundColor: COLORS.error }]} />
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{operationsMetrics?.siteCoverage?.toFixed(1) || 0}%</Text>
          <Text style={styles.metricLabel}>Site Coverage</Text>
          <View style={[styles.statusIndicator, { backgroundColor: COLORS.info }]} />
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{operationsMetrics?.averageResponseTime?.toFixed(1) || 0}min</Text>
          <Text style={styles.metricLabel}>Avg Response</Text>
          <View style={[styles.statusIndicator, { backgroundColor: COLORS.warning }]} />
        </View>
      </View>

      {/* Emergency Alerts */}
      {emergencyAlerts.length > 0 && (
        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>🚨 Active Emergency Alerts</Text>
          {emergencyAlerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.emergencyAlert}
              onPress={() => handleEmergencyAlert(alert.id)}
            >
              <View style={styles.emergencyContent}>
                <Text style={styles.emergencyGuard}>{alert.guardName}</Text>
                <Text style={styles.emergencyMessage}>{alert.message}</Text>
                <Text style={styles.emergencyTime}>
                  {Math.floor((Date.now() - alert.timestamp) / 60000)} minutes ago
                </Text>
              </View>
              <View style={[
                styles.emergencyStatus,
                { backgroundColor: alert.acknowledged ? COLORS.success : COLORS.error }
              ]}>
                <Text style={styles.emergencyStatusText}>
                  {alert.acknowledged ? 'ACK' : 'NEW'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Live Map */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionTitle}>Live Guard Locations</Text>
        <InteractiveMapView
          height={250}
          showControls={true}
          onGuardSelect={(guardId) => console.log('Guard selected:', guardId)}
        />
      </View>
    </View>
  );

  const renderGuardMonitoring = () => (
    <View style={styles.guardMonitoringContainer}>
      <FlatList
        data={guardStatuses}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.guardStatusCard}>
            <View style={styles.guardHeader}>
              <Text style={styles.guardName}>{item.guardName}</Text>
              <View style={[
                styles.guardStatusBadge,
                { backgroundColor: getGuardStatusColor(item.status) }
              ]}>
                <Text style={styles.guardStatusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            
            <Text style={styles.guardSite}>{item.currentSite}</Text>
            <Text style={styles.guardShiftTime}>
              Shift: {formatDuration(item.shiftStart)}
            </Text>
            
            <View style={styles.guardMetrics}>
              <Text style={styles.guardMetric}>
                🔋 {item.batteryLevel}%
              </Text>
              <Text style={styles.guardMetric}>
                📍 ±{item.location.accuracy}m
              </Text>
              <Text style={styles.guardMetric}>
                🕐 {Math.floor((Date.now() - item.lastUpdate) / 1000)}s ago
              </Text>
            </View>
            
            {item.emergencyAlert && (
              <View style={styles.emergencyBanner}>
                <Text style={styles.emergencyBannerText}>
                  🚨 EMERGENCY: {item.emergencyAlert.message}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.guardId}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderViewSelector = () => (
    <View style={styles.viewSelector}>
      {[
        { key: 'overview', label: 'Overview', icon: (active: boolean) => (<ReportsIcon size={18} color={active ? COLORS.textInverse : COLORS.textSecondary} />) },
        { key: 'guards', label: 'Guards', icon: (active: boolean) => (<UserIcon size={18} color={active ? COLORS.textInverse : COLORS.textSecondary} />) },
        { key: 'alerts', label: 'Alerts', icon: (active: boolean) => (<EmergencyIcon size={18} color={active ? COLORS.textInverse : COLORS.textSecondary} />) },
        { key: 'analytics', label: 'Analytics', icon: (active: boolean) => (<SettingsIcon size={18} color={active ? COLORS.textInverse : COLORS.textSecondary} />) },
      ].map((view) => {
        const isActive = selectedView === (view.key as any);
        return (
          <TouchableOpacity
            key={view.key}
            style={[
              styles.viewButton,
              isActive && styles.viewButtonActive,
            ]}
            onPress={() => setSelectedView(view.key as any)}
          >
            <View style={styles.viewIcon}>{view.icon(isActive)}</View>
            <Text style={[
              styles.viewLabel,
              isActive && styles.viewLabelActive,
            ]}>
              {view.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderContent = () => {
    switch (selectedView) {
      case 'overview':
        return renderOperationsOverview();
      case 'guards':
        return renderGuardMonitoring();
      case 'alerts':
        return (
          <View style={styles.alertsContainer}>
            <LiveActivityFeed
              maxItems={20}
              showFilters={true}
              onActivityPress={(activity) => console.log('Activity:', activity)}
            />
          </View>
        );
      case 'analytics':
        return (
          <View style={styles.analyticsContainer}>
            <Text style={styles.analyticsTitle}>Performance Analytics</Text>
            <Text style={styles.analyticsSubtitle}>
              Comprehensive analytics dashboard coming soon...
            </Text>
          </View>
        );
      default:
        return renderOperationsOverview();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Operations Center</Text>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: isLiveMode ? COLORS.success : COLORS.error }]} />
            <Text style={styles.liveText}>{isLiveMode ? 'LIVE' : 'PAUSED'}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.liveToggle}
          onPress={() => setIsLiveMode(!isLiveMode)}
        >
          <Text style={styles.liveToggleText}>{isLiveMode ? 'Pause' : 'Resume'}</Text>
        </TouchableOpacity>
      </View>

      {renderViewSelector()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
    marginRight: SPACING.sm,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  liveText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  liveToggle: {
    backgroundColor: COLORS.backgroundPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  liveToggleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  viewButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginHorizontal: SPACING.xs,
  },
  viewButtonActive: {
    backgroundColor: COLORS.primary,
  },
  viewIcon: {
    marginBottom: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  viewLabelActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emergencySection: {
    marginBottom: SPACING.lg,
  },
  emergencyTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  emergencyAlert: {
    flexDirection: 'row',
    backgroundColor: COLORS.error + '20',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyGuard: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emergencyMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emergencyTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  emergencyStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  emergencyStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  mapSection: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  guardMonitoringContainer: {
    padding: SPACING.md,
  },
  guardStatusCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  guardName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  guardStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  guardStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  guardSite: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  guardShiftTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  guardMetrics: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  guardMetric: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  emergencyBanner: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  emergencyBannerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  alertsContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  analyticsContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  analyticsTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  analyticsSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AdminOperationsCenter;
