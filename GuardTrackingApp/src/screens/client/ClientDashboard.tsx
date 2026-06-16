import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { UserIcon, LocationIcon, ReportsIcon, EmergencyIcon } from '../../components/ui/AppIcons';
import StatsCard from '../../components/ui/StatsCard';
import StatsGrid, { statCardStyle } from '../../components/ui/StatsGrid';
import InteractiveMapView from '../../components/client/InteractiveMapView';
import ShiftCard from '../../components/client/ShiftCard';
import ShiftsTableRow from '../../components/client/ShiftsTableRow';
import { fetchDashboardStats, fetchMyGuards } from '../../store/slices/clientSlice';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { useLiveGuardLocations } from '../../hooks/useLiveGuardLocations';
import { liveGuardMapById } from '../../utils/liveGuardLocationMapper';
import { isValidCoordinate } from '../../utils/liveGuardLocationMapper';
import { parseCoordinate } from '../../utils/mapRegionUtils';
import EmergencyAlertsPanel from '../../components/emergency/EmergencyAlertsPanel';
import apiService from '../../services/api';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';

const { width } = Dimensions.get('window');

interface DashboardStats {
  guardsOnDuty: number;
  missedShifts: number;
  activeSites: number;
  newReports: number;
}

interface GuardData {
  id: string;
  name: string;
  avatar?: string;
  site: string;
  shiftTime: string;
  status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
  checkInTime?: string;
}

const ClientDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    dashboardStats,
    guards,
    loading,
    guardsLoading,
    error,
    guardsError,
  } = useSelector((state: RootState) => state.client);
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: 'ClientNotifications',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [acknowledgingAlertId, setAcknowledgingAlertId] = useState<string | null>(null);
  const [ackCooldownUntilById, setAckCooldownUntilById] = useState<Record<string, number>>({});
  const { ensureCanAdd } = useSubscriptionLimits();

  const supplementalLiveGuards = useMemo(
    () =>
      guards
        .filter((guard) =>
          isValidCoordinate(guard.guardLatitude, guard.guardLongitude)
        )
        .map((guard) => ({
          guardId: guard.id,
          userId: guard.userId,
          guardName: guard.name,
          latitude: parseCoordinate(guard.guardLatitude)!,
          longitude: parseCoordinate(guard.guardLongitude)!,
          siteName: guard.site,
          status:
            guard.status === 'Active'
              ? ('active' as const)
              : ('offline' as const),
          timestamp: Date.now(),
          accuracy: 0,
        })),
    [guards]
  );

  const { guards: liveGuards, refresh: refreshLiveLocations } =
    useLiveGuardLocations({ supplementalGuards: supplementalLiveGuards });

  const liveGuardById = useMemo(() => liveGuardMapById(liveGuards), [liveGuards]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        if (__DEV__) {
          console.warn('⚠️ Dashboard loading timeout - showing UI anyway');
        }
      }, 8000); // 8 second timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  const loadEmergencyAlerts = useCallback(async () => {
    setEmergencyLoading(true);
    try {
      const response = await apiService.getActiveEmergencyAlerts();
      if (response.success && Array.isArray(response.data)) {
        setEmergencyAlerts(response.data);
      } else {
        setEmergencyAlerts([]);
      }
    } catch (err) {
      console.error('Error loading emergency alerts:', err);
      setEmergencyAlerts([]);
    } finally {
      setEmergencyLoading(false);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      // Load data with individual error handling so one failure doesn't block the other
      const statsPromise = dispatch(fetchDashboardStats()).catch((err) => {
        console.error('Error loading dashboard stats:', err);
        return null; // Return null on error instead of throwing
      });

      const guardsPromise = dispatch(fetchMyGuards({ page: 1, limit: 10 })).catch((err) => {
        console.error('Error loading guards:', err);
        return null; // Return null on error instead of throwing
      });

      // Wait for both, but don't fail if one fails
      await Promise.allSettled([statsPromise, guardsPromise, loadEmergencyAlerts()]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't block the UI - allow user to see the screen even if data fails to load
    }
  }, [dispatch, loadEmergencyAlerts]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadDashboardData(), refreshLiveLocations()]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData, refreshLiveLocations]);

  const getCooldownFromMessage = (message?: string): number => {
    if (!message) return 0;
    const match = message.match(/(\d+)\s*second/i);
    return match ? Number(match[1]) : 0;
  };

  const getRemainingCooldownSeconds = (alertId: string): number => {
    const until = ackCooldownUntilById[alertId];
    if (!until) return 0;
    const remainingMs = until - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  };

  const applyAckCooldown = (alertId: string, seconds: number) => {
    if (seconds <= 0) return;
    setAckCooldownUntilById((prev) => ({
      ...prev,
      [alertId]: Date.now() + seconds * 1000,
    }));
  };

  const handleAcknowledgeEmergency = (alertId: string) => {
    if (acknowledgingAlertId) {
      return;
    }

    const remaining = getRemainingCooldownSeconds(alertId);
    if (remaining > 0) {
      Alert.alert('Please Wait', `You can retry this action in ${remaining} seconds.`);
      return;
    }

    Alert.alert(
      'Acknowledge Emergency',
      'Confirm you have received this alert and are taking action.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          onPress: async () => {
            if (acknowledgingAlertId) {
              return;
            }

            setAcknowledgingAlertId(alertId);
            try {
              const result = await apiService.acknowledgeEmergencyAlert(alertId);
              if (result.success) {
                const alreadyHandled =
                  result.message?.toLowerCase().includes('already') ?? false;
                const responseCooldown = getCooldownFromMessage(result.message);
                applyAckCooldown(alertId, responseCooldown || (alreadyHandled ? 20 : 8));
                Alert.alert(
                  alreadyHandled ? 'Already Acknowledged' : 'Acknowledged',
                  alreadyHandled
                    ? 'This emergency alert was already acknowledged.'
                    : 'Emergency alert has been acknowledged.'
                );
                await loadEmergencyAlerts();
              } else {
                Alert.alert('Error', result.message || 'Failed to acknowledge alert.');
              }
            } finally {
              setAcknowledgingAlertId(null);
            }
          },
        },
      ]
    );
  };

  const handleAddNewSite = async () => {
    const allowed = await ensureCanAdd('sites');
    if (allowed) {
      navigation.navigate('AddSite');
    }
  };

  const handleGuardPress = (guardId: string, shiftId?: string) => {
    if (shiftId) {
      navigation.navigate('ShiftDetails', { shiftId });
      return;
    }
    Alert.alert('Shift unavailable', 'No shift details are linked to this guard yet.');
  };

  // Check for network errors
  const isNetworkError = error?.toLowerCase().includes('network') ||
    error?.toLowerCase().includes('connection') ||
    error?.toLowerCase().includes('econnrefused') ||
    error?.toLowerCase().includes('enotfound');

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="client"
        showLogo={true}
        onNotificationPress={onNotificationPress}
        notificationCount={notificationCount}
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToProfile={() => {
              closeDrawer();
              // navigation.navigate('ClientProfile');
            }}
            onNavigateToSites={() => {
              closeDrawer();
              // navigation.navigate('ClientSites');
            }}
            onNavigateToGuards={() => {
              closeDrawer();
              // navigation.navigate('ClientGuards');
            }}
            onNavigateToReports={() => {
              closeDrawer();
              // navigation.navigate('ClientReports');
            }}
            onNavigateToAnalytics={() => {
              closeDrawer();
              // navigation.navigate('ClientAnalytics');
            }}
            onNavigateToNotifications={() => {
              closeDrawer();
              navigation.navigate('ClientNotifications');
            }}
            onNavigateToSupport={() => {
              closeDrawer();
              // navigation.navigate('ClientSupport');
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
        {/* Stats Cards */}
        <StatsGrid inset={false} style={styles.statsContainer}>
          <StatsCard
            label="Guards Active"
            value={dashboardStats?.guardsOnDuty ?? 0}
            icon={<UserIcon size={20} color={COLORS.success} />}
            variant="success"
            style={statCardStyle}
          />
          <StatsCard
            label="Missed"
            value={dashboardStats?.missedShifts ?? 0}
            icon={<EmergencyIcon size={20} color={COLORS.error} />}
            variant="danger"
            style={statCardStyle}
          />
          <StatsCard
            label="Active Sites"
            value={dashboardStats?.activeSites ?? 0}
            icon={<LocationIcon size={20} color={COLORS.info} />}
            variant="info"
            style={statCardStyle}
          />
          <StatsCard
            label="Reports"
            value={dashboardStats?.newReports ?? 0}
            icon={<ReportsIcon size={20} color={COLORS.textSecondary} />}
            variant="neutral"
            style={statCardStyle}
          />
        </StatsGrid>

        <EmergencyAlertsPanel
          alerts={emergencyAlerts}
          loading={emergencyLoading}
          title="Active Emergency"
          onAcknowledge={handleAcknowledgeEmergency}
          onViewReports={() => navigation.navigate('Reports' as never)}
          acknowledgingAlertId={acknowledgingAlertId}
        />

        {/* Loading Overlay - Only show if loading and no timeout */}
        <LoadingOverlay
          visible={loading && !dashboardStats && guards.length === 0 && !error && !loadingTimeout}
          message="Loading dashboard..."
        />

        {/* Error State */}
        {error && !dashboardStats && guards.length === 0 && !loading && (
          <View style={styles.errorContainer}>
            {isNetworkError ? (
              <NetworkError
                onRetry={loadDashboardData}
                style={styles.errorState}
              />
            ) : (
              <ErrorState
                error={error}
                onRetry={loadDashboardData}
                style={styles.errorState}
              />
            )}
          </View>
        )}

        {/* Today's Shifts - Shift Cards */}
        <View style={styles.shiftsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Shifts</Text>
            <TouchableOpacity style={styles.addSiteButton} onPress={handleAddNewSite}>
              <Text style={styles.addSiteButtonText}>Add New Site</Text>
            </TouchableOpacity>
          </View>
          {guardsLoading && guards.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading shifts...</Text>
            </View>
          ) : guards && guards.length > 0 ? (
            guards.map((guard) => {
              const livePosition =
                liveGuardById.get(guard.id) ??
                (guard.userId ? liveGuardById.get(guard.userId) : undefined);
              const shiftCardData = {
                id: guard.id,
                guardId: guard.id,
                guardName: guard.name,
                guardAvatar: guard.avatar,
                siteName: guard.site || 'Unknown Site',
                siteAddress: guard.siteAddress || guard.site || 'Address not available',
                siteLatitude: parseCoordinate(guard.siteLatitude),
                siteLongitude: parseCoordinate(guard.siteLongitude),
                guardLatitude:
                  livePosition?.latitude ?? parseCoordinate(guard.guardLatitude),
                guardLongitude:
                  livePosition?.longitude ?? parseCoordinate(guard.guardLongitude),
                shiftTime: guard.shiftTime || '--:--',
                startTime: guard.startTime || guard.shiftTime?.split(' - ')[0] || '08:00 Am',
                endTime: guard.endTime || guard.shiftTime?.split(' - ')[1] || '07:00 Pm',
                status: guard.status,
                checkInTime: guard.checkInTime,
                checkOutTime: guard.checkOutTime,
                description: guard.description || 'Make sure to check the parking lot for illegal parkings.',
                breakTime: '02:00 pm - 03:00 pm',
                shiftStartIn: '10 min',
              };

              return (
                <ShiftCard
                  key={guard.id}
                  shift={shiftCardData}
                  onPress={() => handleGuardPress(guard.id, guard.shiftId)}
                  onViewLocation={() => {
                    if (guard.shiftId) {
                      navigation.navigate('ShiftDetails', { shiftId: guard.shiftId });
                    }
                  }}
                  onMapPress={() => {
                    if (guard.shiftId) {
                      navigation.navigate('ShiftDetails', { shiftId: guard.shiftId });
                    }
                  }}
                  onGuardPress={(guardId) => {
                    handleGuardPress(guardId, guard.shiftId);
                  }}
                  showMap={true}
                  mapHeight={200}
                />
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No shifts available for today</Text>
            </View>
          )}
        </View>

        {/* Interactive Map Section */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Live Guards Location</Text>
          <InteractiveMapView
            height={200}
            showControls={true}
            liveGuards={liveGuards}
            enableLiveTracking={false}
            onGuardSelect={(guardId: string) => {
              const guard = guards.find((g) => g.id === guardId);
              handleGuardPress(guardId, guard?.shiftId);
            }}
          />
        </View>

        {/* Today's Shifts Summary Table */}
        <View style={styles.shiftsSection}>
          <Text style={styles.sectionTitle}>Todays Shifts Summary</Text>
          <View style={styles.tableContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.tableScrollContent}
            >
              <View style={styles.shiftsTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.guardHeader]}>GUARD</Text>
                  <Text style={[styles.tableHeaderText, styles.siteHeader]}>SITE</Text>
                  <Text style={[styles.tableHeaderText, styles.shiftTimeHeader]}>SHIFT TIME</Text>
                  <Text style={[styles.tableHeaderText, styles.statusHeader]}>STATUS</Text>
                  <Text style={[styles.tableHeaderText, styles.checkInHeader]}>CHECK IN</Text>
                  <Text style={[styles.tableHeaderText, styles.checkOutHeader]}>CHECK OUT</Text>
                </View>
                {guards && guards.length > 0 ? guards.map((guard) => (
                  <ShiftsTableRow
                    key={guard.id}
                    guard={{
                      id: guard.id,
                      name: guard.name,
                      avatar: guard.avatar,
                      site: guard.site,
                      shiftTime: guard.shiftTime,
                      status: guard.status,
                      checkInTime: guard.checkInTime,
                      checkOutTime: guard.checkOutTime,
                    }}
                    onPress={() => handleGuardPress(guard.id, guard.shiftId)}
                  />
                )) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No guards data available</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  statsColumn: {
    flex: 1,
  },
  mapContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  addSiteButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  addSiteButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.info,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  onlineText: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  shiftsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  tableContainer: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  tableScrollContent: {
    minWidth: '100%',
  },
  shiftsTable: {
    minWidth: 700, // Minimum width to ensure all columns are visible
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopLeftRadius: BORDER_RADIUS.md,
    borderTopRightRadius: BORDER_RADIUS.md,
    minHeight: 31,
  },
  tableHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    textAlign: 'left',
  },
  guardHeader: {
    minWidth: 140,
    flex: 1.2,
  },
  siteHeader: {
    minWidth: 120,
    flex: 1,
  },
  shiftTimeHeader: {
    minWidth: 150,
    flex: 1.2,
  },
  statusHeader: {
    minWidth: 100,
    flex: 0.9,
  },
  checkInHeader: {
    minWidth: 100,
    flex: 0.9,
  },
  checkOutHeader: {
    minWidth: 100,
    flex: 0.9,
  },
  emptyState: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorState: {
    flex: 1,
  },
  loadingContainer: {
    padding: SPACING.xxxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default ClientDashboard;
