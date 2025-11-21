/**
 * Admin Operations Center - Exact Figma Design Implementation
 * Live guard monitoring, emergency alerts, and comprehensive operations management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import InteractiveMapView from '../../components/client/InteractiveMapView';
import LiveActivityFeed from '../../components/client/LiveActivityFeed';
import { ErrorHandler } from '../../utils/errorHandler';
import { ReportsIcon, UserIcon, EmergencyIcon, SettingsIcon } from '../../components/ui/AppIcons';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import operationsService, { GuardStatus, OperationsMetrics, EmergencyAlert } from '../../services/operationsService';

interface AdminOperationsCenterProps {
  navigation: any;
}

const AdminOperationsCenter: React.FC<AdminOperationsCenterProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  
  const [guardStatuses, setGuardStatuses] = useState<GuardStatus[]>([]);
  const [operationsMetrics, setOperationsMetrics] = useState<OperationsMetrics | null>(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'guards' | 'alerts' | 'analytics'>('overview');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);

  useEffect(() => {
    initializeOperationsCenter();
    const interval = setupRealTimeUpdates();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveMode]);

  const initializeOperationsCenter = async () => {
    try {
      await Promise.all([
        loadGuardStatuses(),
        loadOperationsMetrics(),
        loadEmergencyAlerts(),
      ]);
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_operations_center');
    }
  };

  const setupRealTimeUpdates = () => {
    if (!isLiveMode) return null;
    
    const interval = setInterval(() => {
      loadGuardStatuses();
      loadOperationsMetrics();
      loadEmergencyAlerts();
    }, 15000); // Update every 15 seconds

    return interval;
  };

  const loadGuardStatuses = async () => {
    try {
      const statuses = await operationsService.getGuardStatuses();
      setGuardStatuses(statuses);
    } catch (error) {
      console.error('Error loading guard statuses:', error);
    }
  };

  const loadOperationsMetrics = async () => {
    try {
      const metrics = await operationsService.getOperationsMetrics();
      setOperationsMetrics(metrics);
    } catch (error) {
      console.error('Error loading operations metrics:', error);
    }
  };

  const loadEmergencyAlerts = async () => {
    try {
      const alerts = await operationsService.getActiveEmergencyAlerts();
      setEmergencyAlerts(alerts);
    } catch (error) {
      console.error('Error loading emergency alerts:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeOperationsCenter();
    setRefreshing(false);
  }, []);

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

  const acknowledgeEmergency = async (alertId: string) => {
    const success = await operationsService.acknowledgeEmergencyAlert(alertId);
    if (success) {
      await loadEmergencyAlerts();
      await loadGuardStatuses();
      Alert.alert('Emergency Acknowledged', 'Emergency services have been dispatched.');
    } else {
      Alert.alert('Error', 'Failed to acknowledge emergency alert.');
    }
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

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const handleGuardSelect = (guardId: string) => {
    setSelectedGuard(selectedGuard === guardId ? null : guardId);
  };

  const renderOperationsOverview = () => {
    const selectedGuardData = selectedGuard 
      ? guardStatuses.find(g => g.guardId === selectedGuard)
      : null;

    return (
      <View style={styles.overviewContainer}>
        {/* Metrics Cards - Exact Figma Specs */}
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

        {/* Emergency Alerts - Exact Figma Specs */}
        {emergencyAlerts.length > 0 && (
          <View style={styles.emergencySection}>
            <View style={styles.emergencySectionHeader}>
              <Text style={styles.emergencyTitle}>Active Emergency Alert</Text>
            </View>
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
                    {formatTimeAgo(alert.timestamp)}
                  </Text>
                </View>
                {!alert.acknowledged && (
                  <View style={styles.emergencyStatusBadge}>
                    <Text style={styles.emergencyStatusText}>NEW</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Live Map - Exact Figma Specs */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Live Guards Location</Text>
          <View style={styles.mapContainer}>
            <InteractiveMapView
              height={300}
              showControls={true}
              onGuardSelect={handleGuardSelect}
              guardData={guardStatuses.map(guard => ({
                guardId: guard.guardId,
                guardName: guard.guardName,
                latitude: guard.location.latitude,
                longitude: guard.location.longitude,
                accuracy: guard.location.accuracy,
                status: guard.status,
                siteName: guard.currentSite,
              }))}
            />
          </View>
          
          {/* Guard Detail Card - Shows when guard is selected */}
          {selectedGuardData && (
            <View style={styles.guardDetailCard}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedGuard(null)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.guardDetailName}>{selectedGuardData.guardName}</Text>
              <Text style={styles.guardDetailSite}>{selectedGuardData.currentSite}</Text>
              <View style={styles.guardDetailStatus}>
                <View style={[styles.guardDetailStatusDot, { backgroundColor: getGuardStatusColor(selectedGuardData.status) }]} />
                <Text style={styles.guardDetailStatusText}>
                  {selectedGuardData.status === 'active' ? 'Active' : selectedGuardData.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.guardDetailUpdate}>
                Last Updated: Just Now
              </Text>
              <Text style={styles.guardDetailAccuracy}>
                Accuracy = {selectedGuardData.location.accuracy}m
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderGuardMonitoring = () => (
    <FlatList
      style={styles.guardMonitoringContainer}
      contentContainerStyle={styles.guardMonitoringContent}
      data={guardStatuses}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={styles.guardStatusCard}
          onPress={() => handleGuardSelect(item.guardId)}
        >
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
            {item.batteryLevel && (
              <Text style={styles.guardMetric}>
                🔋 {item.batteryLevel}%
              </Text>
            )}
            <Text style={styles.guardMetric}>
              📍 ±{item.location.accuracy}m
            </Text>
            <Text style={styles.guardMetric}>
              🕐 {formatTimeAgo(item.lastUpdate)}
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );

  const renderViewSelector = () => (
    <View style={styles.viewSelector}>
      {[
        { key: 'overview', label: 'Overview', icon: ReportsIcon },
        { key: 'guards', label: 'Guards', icon: UserIcon },
        { key: 'alerts', label: 'Alerts', icon: EmergencyIcon },
        { key: 'analytics', label: 'Analytics', icon: SettingsIcon },
      ].map((view) => {
        const isActive = selectedView === (view.key as any);
        const IconComponent = view.icon;
        // Icon color: white when active, gray when inactive
        const iconColor = isActive ? COLORS.textInverse : '#7A7A7A';
        return (
          <TouchableOpacity
            key={view.key}
            style={[
              styles.viewButton,
              isActive && styles.viewButtonActive,
            ]}
            onPress={() => setSelectedView(view.key as any)}
          >
            <View style={styles.viewIcon}>
              <IconComponent size={18} color={iconColor} />
            </View>
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
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Operations Center"
        onNotificationPress={() => {
          // Handle notification press
        }}
        profileDrawer={
          <AdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToOperations={() => {
              closeDrawer();
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
      <View style={styles.container}>
        {/* LIVE Indicator */}
        <View style={styles.liveIndicatorContainer}>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: isLiveMode ? COLORS.success : COLORS.error }]} />
            <Text style={styles.liveText}>{isLiveMode ? 'LIVE' : 'PAUSED'}</Text>
          </View>
          <TouchableOpacity
            style={styles.liveToggle}
            onPress={() => setIsLiveMode(!isLiveMode)}
          >
            <Text style={styles.liveToggleText}>{isLiveMode ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
        </View>

        {renderViewSelector()}
        
        {selectedView === 'guards' ? (
          // Render FlatList directly for guards view (no ScrollView wrapper)
          renderGuardMonitoring()
        ) : (
          // Use ScrollView for other views
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {renderContent()}
          </ScrollView>
        )}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
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
  // View Selector - Exact Figma Specs: Corner radius 11, Padding H:16 V:10, Fill #ECECEC (inactive), accent (active)
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  viewButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10, // Figma: V:10
    paddingHorizontal: 16, // Figma: H:16
    borderRadius: 11, // Figma: Corner radius 11
    marginHorizontal: SPACING.xs,
    backgroundColor: '#ECECEC', // Figma: Fill #ECECEC (inactive)
  },
  viewButtonActive: {
    backgroundColor: COLORS.primary, // Figma: accent (active)
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
  // Metrics Grid - Exact Figma Specs
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF', // Figma: Fill #FFFFFF
    borderRadius: 12, // Figma: Corner radius 12
    padding: SPACING.md,
    position: 'relative',
    borderWidth: 1, // Figma: Stroke weight 1
    borderColor: '#DCDCDC', // Figma: Stroke #DCDCDC
    borderStyle: 'solid',
    // Figma: Drop shadow - X:0, Y:4, Blur:4, Spread:0, Color:#DCDCDC 25%
    shadowColor: '#DCDCDC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  // Emergency Section - Exact Figma Specs
  emergencySection: {
    marginBottom: SPACING.lg,
  },
  emergencySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emergencyTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  emergencyAlert: {
    flexDirection: 'row',
    backgroundColor: '#FEEBEB', // Figma: Fill #FEEBEB
    borderWidth: 2, // Figma: Stroke weight 2
    borderColor: '#DC2626', // Figma: Stroke #DC2626
    borderRadius: 12, // Figma: Corner radius 12
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    // Figma: Drop shadow - X:0, Y:2, Blur:6, Spread:0, Color:#000000 14%
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyGuard: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
  emergencyStatusBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
    height: 20,
    justifyContent: 'center',
  },
  emergencyStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  // Map Section - Exact Figma Specs
  mapSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  mapContainer: {
    borderRadius: 12, // Figma: Corner radius 12
    overflow: 'hidden',
    borderWidth: 1, // Figma: Stroke weight 1
    borderColor: '#DCDCDC', // Figma: Stroke #DCDCDC
    // Figma: Drop shadow - X:0, Y:4, Blur:4, Spread:0, Color:#DCDCDC 25%
    shadowColor: '#DCDCDC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    backgroundColor: COLORS.backgroundPrimary,
  },
  // Guard Detail Card - Exact Figma Specs
  guardDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    shadowColor: '#DCDCDC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textSecondary,
  },
  guardDetailName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  guardDetailSite: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  guardDetailStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  guardDetailStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  guardDetailStatusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  guardDetailUpdate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  guardDetailAccuracy: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  guardMonitoringContainer: {
    flex: 1,
  },
  guardMonitoringContent: {
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
