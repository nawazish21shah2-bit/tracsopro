import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { UserIcon, LocationIcon, ReportsIcon, EmergencyIcon } from '../../components/ui/AppIcons';
import StatsCard from '../../components/ui/StatsCard';
import GuardCard from '../../components/client/GuardCard';
import ShiftsTableRow from '../../components/client/ShiftsTableRow';
import InteractiveMapView from '../../components/client/InteractiveMapView';
import ShiftCard from '../../components/client/ShiftCard';
import { fetchDashboardStats, fetchMyGuards } from '../../store/slices/clientSlice';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import SharedHeader from '../../components/ui/SharedHeader';
import ClientProfileDrawer from '../../components/client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

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
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

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
      await Promise.allSettled([statsPromise, guardsPromise]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't block the UI - allow user to see the screen even if data fails to load
    }
  }, [dispatch]);

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
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData]);

  const handleAddNewSite = () => {
    navigation.navigate('AddSite');
  };

  const handleGuardPress = (guardId: string) => {
    // Navigate to guard details when available
    console.log('Guard pressed:', guardId);
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
        onNotificationPress={() => navigation.navigate('ClientNotifications')}
        notificationCount={5}
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
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statsColumn}>
              <StatsCard
                label="Guards On Duty"
                value={dashboardStats?.guardsOnDuty || 0}
                icon={<UserIcon size={20} color={COLORS.success} />}
                variant="success"
              />
            </View>
            <View style={styles.statsColumn}>
              <StatsCard
                label="Missed Shifts"
                value={dashboardStats?.missedShifts || 0}
                icon={<EmergencyIcon size={20} color={COLORS.error} />}
                variant="danger"
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsColumn}>
              <StatsCard
                label="Active Sites"
                value={dashboardStats?.activeSites || 0}
                icon={<LocationIcon size={20} color={COLORS.info} />}
                variant="info"
              />
            </View>
            <View style={styles.statsColumn}>
              <StatsCard
                label="New Reports"
                value={dashboardStats?.newReports || 0}
                icon={<ReportsIcon size={20} color={COLORS.textSecondary} />}
                variant="neutral"
              />
            </View>
          </View>
        </View>

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
              // Transform guard data to shift card format
              const shiftCardData = {
                id: guard.id,
                guardId: guard.id,
                guardName: guard.name,
                guardAvatar: guard.avatar,
                siteName: guard.site || 'Unknown Site',
                siteAddress: guard.siteAddress || guard.site || 'Address not available',
                siteLatitude: guard.siteLatitude,
                siteLongitude: guard.siteLongitude,
                guardLatitude: guard.guardLatitude,
                guardLongitude: guard.guardLongitude,
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
                  onPress={() => handleGuardPress(guard.id)}
                  onViewLocation={() => {
                    // Navigate to full map view or show location details
                    console.log('View location for:', guard.site);
                    // TODO: Navigate to full map view when route is available
                  }}
                  onMapPress={() => {
                    // Open full screen map view
                    console.log('Map pressed for shift:', guard.id);
                    // TODO: Navigate to full map view when route is available
                  }}
                  onGuardPress={(guardId) => {
                    handleGuardPress(guardId);
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
            onGuardSelect={(guardId: string) => {
              handleGuardPress(guardId);
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
                    onPress={() => handleGuardPress(guard.id)}
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
