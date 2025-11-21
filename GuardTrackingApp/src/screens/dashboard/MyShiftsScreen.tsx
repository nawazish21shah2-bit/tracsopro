// My Shifts Screen - Pixel Perfect Figma Implementation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState } from '../../store';
import { securityManager } from '../../utils/security';
import {
  fetchTodayShifts,
  fetchUpcomingShifts,
  fetchPastShifts,
} from '../../store/slices/shiftSlice';
import { MenuIcon, BellIcon, MapPinIcon, AlertTriangleIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import { globalStyles, COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../styles/globalStyles';
import { AppScreen, AppCard } from '../../components/ui/AppComponents';
import StatsCard from '../../components/ui/StatsCard';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { clearError } from '../../store/slices/shiftSlice';

type MyShiftsScreenNavigationProp = StackNavigationProp<any, 'MyShifts'>;

interface ShiftData {
  id: string;
  location: string;
  address: string;
  status: 'active' | 'upcoming' | 'completed' | 'missed';
  startTime: string;
  endTime: string;
  duration: string;
  description: string;
  clockedIn?: string;
  clockedOut?: string;
  timer?: string;
}

interface MonthlyStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReported: number;
}

interface WeeklyShift {
  date: string;
  day: string;
  site: string;
  shiftTime: string;
  status: 'completed' | 'missed';
  checkIn: string;
  checkOut: string;
}

const MyShiftsScreen: React.FC = () => {
  const navigation = useNavigation<MyShiftsScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const [selectedTab, setSelectedTab] = useState('Today');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const { 
    todayShifts, 
    upcomingShifts, 
    pastShifts, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.shifts);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Use Redux data or fallback to mock data
  const monthlyStats = {
    completedShifts: 21,
    missedShifts: 1,
    totalSites: 5,
    incidentReported: 2,
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const hasValidTokens = await securityManager.areTokensValid();
        if (!hasValidTokens) {
          if (__DEV__) console.log('Skipping shift fetch: no valid tokens');
          return;
        }
        await Promise.all([
          dispatch(fetchTodayShifts() as any),
          dispatch(fetchUpcomingShifts() as any),
          dispatch(fetchPastShifts(20) as any),
        ]);
      } catch (error) {
        console.error('Error loading shifts data:', error);
      }
    };
    loadData();
  }, [dispatch, isAuthenticated]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      dispatch(clearError() as any); // Clear any previous errors
      const hasValidTokens = await securityManager.areTokensValid();
      if (!hasValidTokens) {
        setRefreshing(false);
        return;
      }
      await Promise.all([
        dispatch(fetchTodayShifts() as any),
        dispatch(fetchUpcomingShifts() as any),
        dispatch(fetchPastShifts(20) as any),
      ]);
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Clear error when switching tabs
  useEffect(() => {
    dispatch(clearError() as any);
  }, [activeTab, dispatch]);

  // Handler functions
  const handleMenuPress = () => {
    (navigation as any).dispatch(DrawerActions.openDrawer());
  };

  const handleNotificationPress = () => {
    // TODO: Implement notification functionality
  };



  const handleEmergencyAlert = () => {
    // TODO: Implement emergency alert functionality
    console.log('Emergency alert');
  };

  const [todayShift] = useState<ShiftData>({
    id: '1',
    location: 'Ocean View Vila',
    address: '1321 Baker Street, NY',
    status: 'active',
    startTime: '08:00 am',
    endTime: '07:00 pm',
    duration: '11 hrs',
    description: 'Make sure to check the parking lot for illegal parkings.',
    clockedIn: '08:01 am',
    timer: '03:22:32',
  });

  const [mockUpcomingShifts] = useState<ShiftData[]>([
    {
      id: '2',
      location: 'Ocean View Vila',
      address: '1321 Baker Street, NY',
      status: 'upcoming',
      startTime: '08:00 am',
      endTime: '07:00 pm',
      duration: '10 hrs',
      description: 'Make sure to check the parking lot for illegal parkings.',
    },
  ]);

  const [weeklyShifts] = useState<WeeklyShift[]>([
    {
      date: '23-10-2025',
      day: 'Monday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
    {
      date: '24-10-2025',
      day: 'Tuesday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
    {
      date: '25-10-2025',
      day: 'Wednesday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'missed',
      checkIn: '--:--',
      checkOut: '--:--',
    },
    {
      date: '26-10-2025',
      day: 'Thursday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
    {
      date: '27-10-2025',
      day: 'Friday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
    {
      date: '28-10-2025',
      day: 'Saturday',
      site: 'Ocean Villas',
      shiftTime: '08:00 Am - 07:00 Pm',
      status: 'completed',
      checkIn: '08:02 Am',
      checkOut: '07:00',
    },
  ]);

  const handleAddIncidentReport = () => {
    navigation.navigate('AddIncidentReport');
  };





  const renderMonthlyStats = () => (
    <View style={styles.monthlyStatsContainer}>
      <Text style={styles.monthlyStatsTitle}>This Month Shifts</Text>
      <View style={styles.statsGrid}>
        <StatsCard
          label={'Completed\nShifts'}
          value={monthlyStats.completedShifts}
          icon={<CheckCircleIcon size={18} color={'#4CAF50'} />}
          variant="success"
          style={styles.statItem}
        />
        <StatsCard
          label={'Missed\nShifts'}
          value={monthlyStats.missedShifts}
          icon={<ClockIcon size={18} color={'#EF5350'} />}
          variant="danger"
          style={styles.statItem}
        />
        <StatsCard
          label={'Total\nSites'}
          value={monthlyStats.totalSites}
          icon={<MapPinIcon size={18} color={'#42A5F5'} />}
          variant="info"
          style={styles.statItem}
        />
        <StatsCard
          label={'Incident\nReported'}
          value={monthlyStats.incidentReported}
          icon={<FileTextIcon size={18} color={'#9E9E9E'} />}
          variant="neutral"
          style={styles.statItem}
        />
      </View>
    </View>
  );

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
  ];

  const renderShiftCard = (shift: ShiftData) => (
    <View key={shift.id} style={styles.shiftCard}>
      <View style={styles.shiftHeader}>
        <View style={styles.locationInfo}>
          <MapPinIcon size={20} color="#1C6CA9" />
          <View style={styles.locationText}>
            <Text style={styles.locationName}>{shift.location}</Text>
            <Text style={styles.locationAddress}>{shift.address}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, 
          shift.status === 'active' && styles.activeBadge,
          shift.status === 'upcoming' && styles.upcomingBadge
        ]}>
          <Text style={[styles.statusText,
            shift.status === 'active' && styles.activeText,
            shift.status === 'upcoming' && styles.upcomingText
          ]}>
            {shift.status === 'active' ? 'Active' : 'Upcoming'}
          </Text>
        </View>
      </View>

      <Text style={styles.shiftDescription}>{shift.description}</Text>
      
      <View style={styles.shiftDetails}>
        <Text style={styles.shiftDetailLabel}>Shift Time:</Text>
        <Text style={styles.shiftDetailValue}>{shift.startTime} - {shift.endTime}</Text>
      </View>

      {shift.status === 'active' && (
        <>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{todayShift.timer}</Text>
          </View>
          <Text style={styles.clockedInText}>
            Clocked In at {shift.clockedIn}
          </Text>
          <Text style={styles.clockedInSubtext}>
            Clocked In at 09:00 am
          </Text>
        </>
      )}

      {shift.status === 'upcoming' && (
        <View style={styles.shiftDetails}>
          <Text style={styles.shiftDetailLabel}>Shift Start In:</Text>
          <Text style={styles.shiftDetailValue}>{shift.duration}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.incidentButton} onPress={handleAddIncidentReport}>
          <AlertTriangleIcon size={16} color={'#1976D2'} style={styles.actionIconMargin} />
          <Text style={styles.incidentButtonText}>Add Incident Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
          <AlertCircleIcon size={16} color={'#D32F2F'} style={styles.actionIconMargin} />
          <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWeeklySummary = () => (
    <View style={styles.weeklySummaryContainer}>
      <Text style={styles.weeklySummaryTitle}>This Week's Shifts Summary</Text>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>DATE</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>SITE</Text>
        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>SHIFT TIME</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>STATUS</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>CHECK IN</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>CHECK OUT</Text>
      </View>

      {weeklyShifts.map((shift, index) => (
        <View key={index} style={styles.tableRow}>
          <View style={{ flex: 1.5 }}>
            <Text style={styles.tableCellDate}>{shift.date}</Text>
            <Text style={styles.tableCellDay}>{shift.day}</Text>
          </View>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.site}</Text>
          <Text style={[styles.tableCellText, { flex: 1.5 }]}>{shift.shiftTime}</Text>
          <View style={{ flex: 1 }}>
            <View style={[styles.tableStatusBadge, 
              shift.status === 'completed' && styles.completedBadge,
              shift.status === 'missed' && styles.missedBadge
            ]}>
              <Text style={[styles.tableStatusText,
                shift.status === 'completed' && styles.completedText,
                shift.status === 'missed' && styles.missedText
              ]}>
                {shift.status === 'completed' ? 'Completed' : 'Missed'}
              </Text>
            </View>
          </View>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.checkIn}</Text>
          <Text style={[styles.tableCellText, { flex: 1 }]}>{shift.checkOut}</Text>
        </View>
      ))}
    </View>
  );

  // Helper to adapt Redux shift to local ShiftData for UI
  const toShiftData = (s: any): ShiftData => ({
    id: s.id,
    location: s.locationName || s.location || 'Unknown Site',
    address: s.locationAddress || s.address || '',
    status: s.status === 'IN_PROGRESS' ? 'active' : (s.status === 'SCHEDULED' ? 'upcoming' : 'completed'),
    startTime: s.startTime ? new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
    endTime: s.endTime ? new Date(s.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--',
    duration: '—',
    description: s.description || '',
    clockedIn: s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
    clockedOut: s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
  });

  // Check if error is related to the current tab
  const isErrorRelevant = () => {
    if (!error) return false;
    const errorLower = error.toLowerCase();
    if (activeTab === 'upcoming' && errorLower.includes('upcoming')) return true;
    if (activeTab === 'today' && errorLower.includes('today')) return true;
    if (activeTab === 'past' && errorLower.includes('past')) return true;
    return false;
  };

  const isNetworkError = error?.toLowerCase().includes('network') || 
                         error?.toLowerCase().includes('connection') ||
                         error?.toLowerCase().includes('econnrefused') ||
                         error?.toLowerCase().includes('enotfound');

  const handleRetry = async () => {
    dispatch(clearError() as any);
    const hasValidTokens = await securityManager.areTokensValid();
    if (!hasValidTokens) return;
    
    switch (activeTab) {
      case 'today':
        await dispatch(fetchTodayShifts() as any);
        break;
      case 'upcoming':
        await dispatch(fetchUpcomingShifts() as any);
        break;
      case 'past':
        await dispatch(fetchPastShifts(20) as any);
        break;
    }
  };

  const renderContent = () => {
    // Show error state if there's an error relevant to current tab
    if (isErrorRelevant()) {
      return (
        <View style={styles.errorContainer}>
          {isNetworkError ? (
            <NetworkError
              onRetry={handleRetry}
              style={styles.errorState}
            />
          ) : (
            <ErrorState
              error={error || 'An error occurred'}
              onRetry={handleRetry}
              style={styles.errorState}
            />
          )}
        </View>
      );
    }

    switch (activeTab) {
      case 'today':
        return (
          <View>
            {renderShiftCard(todayShift)}
            {renderWeeklySummary()}
          </View>
        );
      case 'upcoming':
        // Show empty state if no shifts, but only if not loading and no error
        if (!loading && (!upcomingShifts || !Array.isArray(upcomingShifts) || upcomingShifts.length === 0)) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No upcoming shifts</Text>
              <Text style={styles.emptySubtext}>You don't have any upcoming shifts scheduled</Text>
            </View>
          );
        }
        return (
          <View>
            {(
              upcomingShifts && Array.isArray(upcomingShifts) && upcomingShifts.length
                ? upcomingShifts.map(toShiftData)
                : mockUpcomingShifts
            ).map(renderShiftCard)}
          </View>
        );
      case 'past':
        if (!loading && (!pastShifts || !Array.isArray(pastShifts) || pastShifts.length === 0)) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No past shifts to display</Text>
            </View>
          );
        }
        return (
          <View>
            {pastShifts && Array.isArray(pastShifts) && pastShifts.length > 0
              ? pastShifts.map(toShiftData).map(renderShiftCard)
              : <Text style={styles.emptyText}>No past shifts to display</Text>
            }
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SharedHeader
        variant="guard"
        title="My Shifts"
        onNotificationPress={handleNotificationPress}
        profileDrawer={
          <GuardProfileDrawer
            visible={false}
            onClose={() => {}}
            onNavigateToProfile={() => {
              // Navigate to profile/settings when available
            }}
            onNavigateToPastJobs={() => {
              // Navigation handled in drawer
            }}
            onNavigateToAssignedSites={() => {
              // Navigation handled in drawer
            }}
            onNavigateToAttendance={() => {
              // Navigation handled in drawer
            }}
            onNavigateToEarnings={() => {
              // Navigation handled in drawer
            }}
            onNavigateToNotifications={() => {
              // Navigate to notifications/settings
            }}
            onNavigateToSupport={() => {
              // Navigation handled in drawer
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
        {renderMonthlyStats()}
        
        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id as 'today' | 'upcoming' | 'past')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}
        {/* Only show weekly summary on today tab */}
        {activeTab === 'today' && renderWeeklySummary()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  monthlyStatsContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  monthlyStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconText: {
    fontSize: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#1C6CA9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#E8F5E8',
  },
  upcomingBadge: {
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: '#4CAF50',
  },
  upcomingText: {
    color: '#2196F3',
  },
  shiftDescription: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 20,
  },
  shiftDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shiftDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  shiftDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  timerContainer: {
    backgroundColor: '#9CA3AF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clockedInText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  clockedInSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  incidentButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  incidentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emergencyButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D32F2F',
  },
  weeklySummaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  weeklySummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCellDate: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  tableCellDay: {
    fontSize: 10,
    color: '#6B7280',
  },
  tableCellText: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
  },
  tableStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#E8F5E8',
  },
  missedBadge: {
    backgroundColor: '#FFEBEE',
  },
  tableStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  completedText: {
    color: '#4CAF50',
  },
  missedText: {
    color: '#F44336',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 300,
  },
  errorState: {
    width: '100%',
  },
  actionIconMargin: {
    marginRight: 8,
  },
});

export default MyShiftsScreen;
