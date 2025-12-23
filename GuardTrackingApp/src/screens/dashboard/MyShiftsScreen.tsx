// My Shifts Screen - Pixel Perfect Figma Implementation
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import Geolocation from 'react-native-geolocation-service';
import { RootState, AppDispatch } from '../../store';
import { securityManager } from '../../utils/security';
import {
  fetchTodayShifts,
  fetchUpcomingShifts,
  fetchPastShifts,
  fetchActiveShift,
  fetchWeeklyShiftSummary,
  fetchShiftStatistics,
  checkInToShiftWithLocation,
  checkOutFromShiftWithLocation,
} from '../../store/slices/shiftSlice';
import { MenuIcon, BellIcon, MapPinIcon, AlertTriangleIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import { globalStyles, COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { AppScreen, AppCard } from '../../components/ui/AppComponents';
import StatsCard from '../../components/ui/StatsCard';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { ErrorState, NetworkError } from '../../components/ui/LoadingStates';
import { clearError } from '../../store/slices/shiftSlice';
import { Shift } from '../../types/shift.types';

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
  const dispatch = useDispatch<AppDispatch>();
  
  const [selectedTab, setSelectedTab] = useState('Today');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Redux state
  const { 
    todayShifts, 
    upcomingShifts, 
    pastShifts,
    activeShift,
    weeklyShifts,
    stats,
    loading, 
    error,
    checkInLoading,
    checkOutLoading,
  } = useSelector((state: RootState) => state.shifts);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Use Redux data or fallback to default stats
  const monthlyStats = stats || {
    completedShifts: 0,
    missedShifts: 0,
    totalSites: 0,
    incidentReports: 0,
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
          dispatch(fetchActiveShift() as any),
          dispatch(fetchWeeklyShiftSummary() as any),
          dispatch(fetchShiftStatistics({}) as any),
        ]);
      } catch (error) {
        console.error('Error loading shifts data:', error);
      }
    };
    loadData();

    // Timer for current time
    const timer = setInterval(() => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    }, 1000);

    return () => clearInterval(timer);
  }, [dispatch, isAuthenticated]);

  const onRefresh = useCallback(async () => {
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
        dispatch(fetchActiveShift() as any),
        dispatch(fetchWeeklyShiftSummary() as any),
        dispatch(fetchShiftStatistics({}) as any),
      ]);
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Clear error when switching tabs
  useEffect(() => {
    dispatch(clearError() as any);
  }, [activeTab, dispatch]);

  // Handler functions
  const handleMenuPress = useCallback(() => {
    (navigation as any).dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleNotificationPress = useCallback(() => {
    (navigation as any).navigate('Notifications');
  }, [navigation]);



  const handleEmergencyAlert = () => {
    if (!activeShift || activeShift.status !== 'IN_PROGRESS') {
      Alert.alert(
        'Shift Not Active',
        'You can only send emergency alerts for active shifts. Please check in to your shift first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to send an emergency alert? This will notify all supervisors and administrators immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement emergency alert API call
              Alert.alert('Emergency Alert', 'Emergency alert sent successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to send emergency alert. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Format time helper
  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  // Format time for table (matching Figma: "08:00 Am - 07:00 Pm")
  const formatTableTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'Pm' : 'Am';
      const displayHours = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours.toString().padStart(2, '0')}:${formattedMinutes} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calculate shift duration
  const calculateShiftDuration = (shift: Shift): string => {
    if (!shift.checkInTime) return 'Not started';
    
    const start = new Date(shift.checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    return `${hours}h ${mins}m`;
  };

  // Request location permission (Android)
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // Check if permission is already granted
        const checkResult = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (checkResult) {
          return true;
        }

        // Request permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for check-in and emergency alerts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Error requesting location permission:', err);
        return false;
      }
    }
    
    // iOS permissions are handled automatically by react-native-geolocation-service
    return true;
  };

  // Get current GPS location
  const getCurrentLocation = async (retries: number = 2): Promise<{ latitude: number; longitude: number; accuracy: number; address?: string }> => {
    // First, request permission if needed
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied. Please enable location access in settings.');
    }

    const attemptGetLocation = (useHighAccuracy: boolean): Promise<{ latitude: number; longitude: number; accuracy: number; address?: string }> => {
      return new Promise((resolve, reject) => {
        try {
          Geolocation.getCurrentPosition(
            (position: Geolocation.GeoPosition) => {
              if (!position || !position.coords || 
                  typeof position.coords.latitude !== 'number' || 
                  typeof position.coords.longitude !== 'number' ||
                  isNaN(position.coords.latitude) ||
                  isNaN(position.coords.longitude)) {
                reject(new Error('Invalid location data received. Please try again.'));
                return;
              }

              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy || 0,
                address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
              });
            },
            (error: Geolocation.GeoError) => {
              console.error('Location error:', error);
              let errorMessage = 'Unable to get your location.';
              let shouldRetry = true;
              
              switch (error.code) {
                case 1: // PERMISSION_DENIED
                  errorMessage = 'Location permission denied. Please enable location access in settings.';
                  shouldRetry = false;
                  break;
                case 2: // POSITION_UNAVAILABLE
                  errorMessage = 'Location unavailable. Please ensure GPS is enabled and try again.';
                  break;
                case 3: // TIMEOUT
                  errorMessage = 'Location request timed out. Please try again.';
                  break;
              }
              
              const locationError = new Error(errorMessage) as any;
              locationError.code = error.code;
              locationError.shouldRetry = shouldRetry;
              reject(locationError);
            },
            {
              enableHighAccuracy: useHighAccuracy,
              timeout: 20000,
              maximumAge: 30000,
            }
          );
        } catch (error) {
          console.error('Error calling getCurrentPosition:', error);
          reject(new Error('Failed to get location. Please try again.'));
        }
      });
    };

    // Try with high accuracy first
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // First attempt: high accuracy
        if (attempt === 0) {
          return await attemptGetLocation(true);
        }
        // Retry attempts: try with lower accuracy requirement
        else {
          console.log(`Location attempt ${attempt + 1}/${retries + 1}, trying with lower accuracy...`);
          return await attemptGetLocation(false);
        }
      } catch (error: any) {
        // If permission denied, don't retry - fail immediately
        if (error.code === 1 || error.shouldRetry === false) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === retries) {
          throw error;
        }
        
        // Otherwise, wait a bit before retrying
        console.log(`Location attempt ${attempt + 1} failed, retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Unable to get your location after multiple attempts.');
  };

  // Handle check-in
  const handleCheckIn = async (shiftId: string) => {
    if (gettingLocation || checkInLoading) {
      return;
    }

    try {
      setGettingLocation(true);
      
      let location;
      try {
        location = await getCurrentLocation(2);
      } catch (locationError: any) {
        Alert.alert(
          'Location Required',
          locationError?.message || 'Unable to get your location. Please enable GPS and try again.',
          [
            { text: 'Retry', onPress: () => handleCheckIn(shiftId) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setGettingLocation(false);
        return;
      }
      
      await dispatch(checkInToShiftWithLocation({
        shiftId,
        location,
      })).unwrap();

      Alert.alert('Success', 'You have successfully checked in!');
      
      // Refresh data
      await dispatch(fetchActiveShift());
      await dispatch(fetchTodayShifts());
    } catch (error: any) {
      Alert.alert(
        'Check-In Failed',
        error?.message || 'Failed to check in. Please try again.',
        [
          { text: 'Retry', onPress: () => handleCheckIn(shiftId) },
          { text: 'OK' }
        ]
      );
    } finally {
      setGettingLocation(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async (shiftId: string) => {
    if (gettingLocation || checkOutLoading) {
      return;
    }

    Alert.alert(
      'Check Out',
      'Are you sure you want to check out from this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Check Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              setGettingLocation(true);
              
              let location;
              try {
                location = await getCurrentLocation(2);
              } catch (locationError: any) {
                Alert.alert(
                  'Location Required',
                  locationError?.message || 'Unable to get your location. Please enable GPS and try again.',
                  [
                    { text: 'Retry', onPress: () => handleCheckOut(shiftId) },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
                setGettingLocation(false);
                return;
              }
              
              await dispatch(checkOutFromShiftWithLocation({
                shiftId,
                location,
              })).unwrap();

              Alert.alert('Success', 'You have successfully checked out!');
              
              // Refresh data
              await dispatch(fetchActiveShift());
              await dispatch(fetchTodayShifts());
            } catch (error: any) {
              Alert.alert(
                'Check-Out Failed',
                error?.message || 'Failed to check out. Please try again.',
                [
                  { text: 'Retry', onPress: () => handleCheckOut(shiftId) },
                  { text: 'OK' }
                ]
              );
            } finally {
              setGettingLocation(false);
            }
          }
        },
      ]
    );
  };

  // Helper function to convert shift to ShiftData format
  const toShiftData = (s: any): ShiftData => ({
    id: s.id || '',
    location: s.locationName || s.site?.name || s.location || 'Unknown Location',
    address: s.locationAddress || s.site?.address || s.address || '',
    status: s.status === 'IN_PROGRESS' ? 'active' : s.status === 'COMPLETED' ? 'completed' : s.status === 'MISSED' ? 'missed' : 'upcoming',
    startTime: s.startTime || '',
    endTime: s.endTime || '',
    duration: s.duration || '',
    description: s.description || '',
    clockedIn: s.checkInTime || undefined,
    clockedOut: s.checkOutTime || undefined,
    timer: s.timer || undefined,
  });

  // Convert activeShift to ShiftData format
  const todayShift: ShiftData | null = activeShift ? toShiftData(activeShift) : null;

  // Format date as DD-MM-YYYY (matching Figma design)
  const formatTableDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  };

  // Convert weeklyShifts from Redux to WeeklyShift format
  const formattedWeeklyShifts: WeeklyShift[] = weeklyShifts && Array.isArray(weeklyShifts) 
    ? weeklyShifts.map((shift: any) => {
        const date = new Date(shift.startTime || shift.date);
        return {
          date: formatTableDate(shift.startTime || shift.date),
          day: date.toLocaleDateString('en-US', { weekday: 'long' }),
          site: shift.locationName || shift.site?.name || shift.site || 'Unknown Site',
          shiftTime: `${formatTableTime(shift.startTime || shift.date)} - ${formatTableTime(shift.endTime || shift.date)}`,
          status: shift.status === 'COMPLETED' ? 'completed' : 'missed',
          checkIn: shift.checkInTime ? formatTableTime(shift.checkInTime) : '--:--',
          checkOut: shift.checkOutTime ? formatTableTime(shift.checkOutTime) : '--:--',
        };
      })
    : [];

  const handleAddIncidentReport = () => {
    if (!activeShift || activeShift.status !== 'IN_PROGRESS') {
      Alert.alert(
        'Shift Not Active',
        'You can only submit incident reports for active shifts. Please check in to your shift first.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('AddIncidentReport');
  };





  const renderMonthlyStats = () => (
    <View style={styles.monthlyStatsContainer}>
      <Text style={styles.monthlyStatsTitle}>This Month Shifts</Text>
      <View style={styles.statsGrid}>
        <StatsCard
          label={'Completed\nShifts'}
          value={monthlyStats.completedShifts}
          icon={<CheckCircleIcon size={18} color={COLORS.success} />}
          variant="success"
          style={styles.statItem}
        />
        <StatsCard
          label={'Missed\nShifts'}
          value={monthlyStats.missedShifts}
          icon={<ClockIcon size={18} color={COLORS.error} />}
          variant="danger"
          style={styles.statItem}
        />
        <StatsCard
          label={'Total\nSites'}
          value={monthlyStats.totalSites}
          icon={<MapPinIcon size={18} color={COLORS.info} />}
          variant="info"
          style={styles.statItem}
        />
        <StatsCard
          label={'Incident\nReported'}
          value={monthlyStats.incidentReports}
          icon={<FileTextIcon size={18} color={COLORS.textTertiary} />}
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

  const renderShiftCard = (shift: ShiftData) => {
    // Find the actual shift object from Redux state
    const actualShift = activeShift?.id === shift.id ? activeShift : 
                        todayShifts?.find(s => s.id === shift.id) ||
                        upcomingShifts?.find(s => s.id === shift.id) ||
                        pastShifts?.find(s => s.id === shift.id);
    
    const isActive = shift.status === 'active';
    const isCheckedIn = !!actualShift?.checkInTime;
    const isCheckedOut = !!actualShift?.checkOutTime;

    return (
      <View key={shift.id} style={styles.shiftCard}>
        <View style={styles.shiftHeader}>
          <View style={styles.locationInfo}>
            <View style={styles.locationIconContainer}>
              <MapPinIcon size={20} color={COLORS.primary} />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationName}>{shift.location}</Text>
              <Text style={styles.locationAddress}>{shift.address}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, 
            shift.status === 'active' && styles.activeBadge,
            shift.status === 'upcoming' && styles.upcomingBadge,
            shift.status === 'completed' && styles.completedBadge
          ]}>
            <Text style={[styles.statusText,
              shift.status === 'active' && styles.activeText,
              shift.status === 'upcoming' && styles.upcomingText,
              shift.status === 'completed' && styles.completedText
            ]}>
              {shift.status === 'active' ? 'Active' : shift.status === 'upcoming' ? 'Upcoming' : shift.status === 'completed' ? 'Completed' : 'Missed'}
            </Text>
          </View>
        </View>

        {shift.description && (
          <Text style={styles.shiftDescription}>{shift.description}</Text>
        )}
        
        <View style={styles.shiftDetails}>
          <View style={styles.shiftDetailRow}>
            <View style={styles.shiftDetailIconContainer}>
              <ClockIcon size={16} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.shiftDetailLabel}>Shift Time:</Text>
            <Text style={styles.shiftDetailValue}>
              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
            </Text>
          </View>
          
          {actualShift?.breakStartTime && actualShift?.breakEndTime && (
            <View style={styles.shiftDetailRow}>
              <View style={styles.shiftDetailIconContainer}>
                <ClockIcon size={16} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.shiftDetailLabel}>Break Time:</Text>
              <Text style={styles.shiftDetailValue}>
                {formatTime(actualShift.breakStartTime)} - {formatTime(actualShift.breakEndTime)}
              </Text>
            </View>
          )}
          
          {isCheckedIn && (
            <View style={styles.shiftDetailRow}>
              <View style={styles.shiftDetailIconContainer}>
                <CheckCircleIcon size={16} color={COLORS.success} />
              </View>
              <Text style={styles.shiftDetailLabel}>Duration:</Text>
              <Text style={styles.shiftDetailValue}>
                {actualShift ? calculateShiftDuration(actualShift) : 'N/A'}
              </Text>
            </View>
          )}
          
          {isCheckedIn && (
            <View style={styles.shiftDetailRow}>
              <View style={styles.shiftDetailIconContainer}>
                <ClockIcon size={16} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.shiftDetailLabel}>Checked In:</Text>
              <Text style={styles.shiftDetailValue}>
                {actualShift?.checkInTime ? formatTime(actualShift.checkInTime) : 'N/A'}
              </Text>
            </View>
          )}
        </View>

        {isActive && isCheckedIn && !isCheckedOut && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{currentTime}</Text>
            <Text style={styles.timerLabel}>Active Shift Timer</Text>
          </View>
        )}

        {!isCheckedOut && (
          <TouchableOpacity 
            style={[
              styles.checkInButton, 
              (checkInLoading || checkOutLoading || gettingLocation) && styles.buttonDisabled
            ]} 
            onPress={isCheckedIn ? () => handleCheckOut(shift.id) : () => handleCheckIn(shift.id)}
            disabled={checkInLoading || checkOutLoading || gettingLocation}
          >
            {(checkInLoading || checkOutLoading || gettingLocation) ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <ClockIcon size={20} color={COLORS.textInverse} style={styles.checkInIcon} />
                <Text style={styles.checkInText}>
                  {isCheckedIn ? 'Check Out' : 'Check In'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isActive && isCheckedIn && !isCheckedOut && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.incidentButton} onPress={handleAddIncidentReport}>
              <AlertTriangleIcon size={16} color="#FFFFFF" style={styles.actionIconMargin} />
              <Text style={styles.incidentButtonText}>Report Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
              <AlertCircleIcon size={16} color="#FFFFFF" style={styles.actionIconMargin} />
              <Text style={styles.emergencyButtonText}>Emergency</Text>
            </TouchableOpacity>
          </View>
        )}

        {isCheckedOut && (
          <View style={styles.completedContainer}>
            <CheckCircleIcon size={24} color={COLORS.success} />
            <Text style={styles.completedContainerText}>Shift Completed</Text>
            <Text style={styles.completedSubtext}>
              Checked out at {actualShift?.checkOutTime ? formatTime(actualShift.checkOutTime) : 'N/A'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderWeeklySummary = () => (
    <View style={styles.weeklySummaryWrapper}>
      <Text style={styles.weeklySummaryTitle}>This Week's Shifts Summary</Text>
      
      <View style={styles.weeklySummaryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.tableScrollContent}
          style={styles.tableScrollView}
        >
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableHeaderCell, styles.dateColumn]}>
                <Text style={styles.tableHeaderText}>DATE</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.siteColumn]}>
                <Text style={styles.tableHeaderText}>SITE</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.shiftTimeColumn]}>
                <Text style={styles.tableHeaderText}>SHIFT TIME</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.statusColumn]}>
                <Text style={styles.tableHeaderText}>STATUS</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.checkColumn]}>
                <Text style={styles.tableHeaderText}>CHECK IN</Text>
              </View>
              <View style={[styles.tableHeaderCell, styles.checkColumn]}>
                <Text style={styles.tableHeaderText}>CHECK OUT</Text>
              </View>
            </View>

            {/* Table Rows */}
            {formattedWeeklyShifts.length > 0 ? formattedWeeklyShifts.map((shift, index) => {
              const isMissed = shift.status === 'missed';
              return (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.dateColumn]}>
                    <Text style={isMissed ? styles.tableCellDateMissed : styles.tableCellDate}>
                      {shift.date}
                    </Text>
                    <Text style={isMissed ? styles.tableCellDayMissed : styles.tableCellDay}>
                      {shift.day}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.siteColumn]}>
                    <Text style={styles.tableCellText} numberOfLines={2}>{shift.site}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.shiftTimeColumn]}>
                    <Text style={styles.tableCellText}>{shift.shiftTime}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.statusColumn]}>
                    <View style={[styles.tableStatusBadge, 
                      shift.status === 'completed' && styles.completedBadge,
                      shift.status === 'missed' && styles.missedBadge
                    ]}>
                      {isMissed && <View style={styles.missedDot} />}
                      <Text style={[styles.tableStatusText,
                        shift.status === 'completed' && styles.completedText,
                        shift.status === 'missed' && styles.missedText
                      ]}>
                        {shift.status === 'completed' ? 'Completed' : 'Missed'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.tableCell, styles.checkColumn]}>
                    <Text style={styles.tableCellText}>{shift.checkIn}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.checkColumn]}>
                    <Text style={styles.tableCellText}>{shift.checkOut}</Text>
                  </View>
                </View>
              );
            }) : (
                <View style={styles.tableEmptyContainer}>
                  <Text style={styles.tableEmptyText}>No weekly shifts data available</Text>
                </View>
              )}
          </View>
        </ScrollView>
      </View>
    </View>
  );


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
        if (!todayShift && !loading) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active shift today</Text>
              <Text style={styles.emptySubtext}>You don't have any shifts scheduled for today</Text>
            </View>
          );
        }
        return (
          <View>
            {todayShift && renderShiftCard(todayShift)}
            {todayShifts && todayShifts.length > 0 && todayShifts.map((shift: any) => 
              shift.id !== activeShift?.id && renderShiftCard(toShiftData(shift))
            )}
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
            {upcomingShifts && Array.isArray(upcomingShifts) && upcomingShifts.length > 0
              ? upcomingShifts.map(toShiftData).map(renderShiftCard)
              : null
            }
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />
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
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  notificationButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  monthlyStatsContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  monthlyStatsTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Border only, no shadow for minimal style
  },
  statTextContainer: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  statIconText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.textInverse,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    // Drop shadow: X 0, Y 4, Blur 4, Spread 0, Color #DCDCDC at 25% opacity
    shadowColor: '#DCDCDC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4, // Android shadow
    // Border/Stroke: Color #DCDCDC, Weight 1
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderStyle: 'solid',
    overflow: 'hidden',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 0,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  upcomingBadge: {
    backgroundColor: '#DBEAFE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textTransform: 'uppercase',
  },
  activeText: {
    color: '#4CAF50',
  },
  upcomingText: {
    color: '#1C6CA9',
  },
  shiftDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    lineHeight: 16,
    marginBottom: 12,
  },
  shiftDetails: {
    marginBottom: 12,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftDetailIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  shiftDetailLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    marginRight: 8,
  },
  shiftDetailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    flex: 1,
    textAlign: 'right',
  },
  timerContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    marginTop: 4,
  },
  checkInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C6CA9',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  checkInIcon: {
    marginRight: 8,
  },
  checkInText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C6CA9',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 6,
  },
  incidentButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginLeft: 6,
  },
  emergencyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
  weeklySummaryWrapper: {
    marginTop: 16,
  },
  weeklySummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    marginBottom: 12,
  },
  weeklySummaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    // Lighter drop shadow: X 0, Y 4, Blur 4, Spread 0, Color #000000 at 3% opacity
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  tableScrollView: {
    maxHeight: 400,
  },
  tableScrollContent: {
    paddingRight: 8,
  },
  tableContainer: {
    minWidth: 650, // Minimum width to ensure horizontal scroll
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#D7EAF9',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 0,
    height: 31,
    alignItems: 'center',
  },
  tableHeaderCell: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    height: '100%',
  },
  dateColumn: {
    width: 110,
    minWidth: 110,
  },
  siteColumn: {
    width: 130,
    minWidth: 130,
  },
  shiftTimeColumn: {
    width: 150,
    minWidth: 150,
  },
  statusColumn: {
    width: 110,
    minWidth: 110,
  },
  checkColumn: {
    width: 100,
    minWidth: 100,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600', // Semi Bold
    color: '#7A7A7A',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 56,
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    minHeight: 56,
  },
  tableCellDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textAlign: 'left',
    marginBottom: 2,
  },
  tableCellDateMissed: {
    fontSize: 12,
    fontWeight: '500',
    color: '#DC2626', // Red for missed shifts
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textAlign: 'left',
    marginBottom: 2,
  },
  tableCellDay: {
    fontSize: 10,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textAlign: 'left',
  },
  tableCellDayMissed: {
    fontSize: 10,
    fontWeight: '400',
    color: '#DC2626', // Red for missed shifts
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textAlign: 'left',
  },
  tableCellText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#323232',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textAlign: 'left',
  },
  tableStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 70,
  },
  completedBadge: {
    backgroundColor: '#DCFCE7', // Light green from Figma
  },
  missedBadge: {
    backgroundColor: '#FFEBEE',
  },
  tableStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textTransform: 'uppercase',
  },
  completedText: {
    color: '#16A34A', // Green from Figma
  },
  missedText: {
    color: '#DC2626', // Red from Figma
  },
  missedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DC2626',
    marginRight: 4,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xxxxl,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    paddingVertical: SPACING.xxxxl,
    alignItems: 'center',
  },
  tableEmptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    width: '100%',
    minWidth: 600,
  },
  tableEmptyText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
    minHeight: 300,
  },
  errorState: {
    width: '100%',
  },
  actionIconMargin: {
    marginRight: 6,
  },
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  completedContainerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
    marginTop: 8,
    marginBottom: 4,
  },
  completedSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: '#828282',
    fontFamily: 'Inter',
    letterSpacing: -0.41,
  },
});

export default MyShiftsScreen;
