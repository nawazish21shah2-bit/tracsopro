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

  const loadDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchDashboardStats()),
        dispatch(fetchMyGuards({ page: 1, limit: 10 })),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  const handleAssignNewShift = () => {
    navigation.navigate('CreateShift');
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
                icon={<UserIcon size={20} color="#16A34A" />}
                variant="success"
              />
            </View>
            <View style={styles.statsColumn}>
              <StatsCard
                label="Missed Shifts"
                value={dashboardStats?.missedShifts || 0}
                icon={<EmergencyIcon size={20} color="#DC2626" />}
                variant="danger"
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsColumn}>
              <StatsCard
                label="Active Sites"
                value={dashboardStats?.activeSites || 0}
                icon={<LocationIcon size={20} color="#1976D2" />}
                variant="info"
              />
            </View>
            <View style={styles.statsColumn}>
              <StatsCard
                label="New Reports"
                value={dashboardStats?.newReports || 0}
                icon={<ReportsIcon size={20} color="#6B7280" />}
                variant="neutral"
              />
            </View>
          </View>
        </View>

        {/* Assign New Shift Button */}
        <View style={styles.assignButtonContainer}>
          <TouchableOpacity style={styles.assignButton} onPress={handleAssignNewShift}>
            <Text style={styles.assignButtonText}>Assign New Shift</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        <LoadingOverlay
          visible={loading && !dashboardStats && guards.length === 0}
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
          <Text style={styles.sectionTitle}>Today's Shifts</Text>
          {guardsLoading && guards.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1C6CA9" />
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
    padding: 16,
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  statsColumn: {
    flex: 1,
  },
  assignButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  assignButton: {
    backgroundColor: '#1C6CA9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '500',
  },
  onlineText: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  shiftsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    // Drop shadow: X 0, Y 4, Blur 4, Spread 0, Color #000000 at 6% opacity
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tableScrollContent: {
    minWidth: '100%',
  },
  shiftsTable: {
    minWidth: 700, // Minimum width to ensure all columns are visible
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D7EAF9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: 31,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#323232',
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorState: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
});

export default ClientDashboard;
