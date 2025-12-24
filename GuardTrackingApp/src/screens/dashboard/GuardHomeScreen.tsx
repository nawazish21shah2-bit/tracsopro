// Guard Dashboard Home Screen - Fully Integrated with Backend
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { getCurrentLocationWithRetry } from '../../utils/safeLocationHelper';
import { getCurrentLocationWithRetry } from '../../utils/safeLocationHelper';
import {
  fetchShiftStatistics,
  fetchActiveShift,
  fetchUpcomingShifts,
  checkInToShiftWithLocation,
  checkOutFromShiftWithLocation,
  refreshDashboardData,
} from '../../store/slices/shiftSlice';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { AppScreen, AppCard, AppStatGrid } from '../../components/ui/AppComponents';
import StatsCard from '../../components/ui/StatsCard';
import SharedHeader from '../../components/ui/SharedHeader';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { LoadingOverlay, ErrorState, NetworkError, InlineLoading } from '../../components/ui/LoadingStates';
import {
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  UserIcon,
  BellIcon,
} from '../../components/ui/FeatherIcons';
import { Shift, ShiftStatus } from '../../types/shift.types';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';
import apiService from '../../services/api';

type GuardHomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<any, 'GuardHome'>,
  StackNavigationProp<GuardStackParamList>
>;

interface ShiftData {
  id: string;
  location: string;
  address: string;
  status: 'active' | 'upcoming' | 'completed';
  startTime: string;
  endTime: string;
  duration: string;
  description: string;
  clockedIn?: string;
  clockedOut?: string;
}

interface StatsData {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReports: number;
}

interface NotificationData {
  id: string;
  user: string;
  avatar: string;
  action: string;
  time: string;
  site: string;
  status: 'active' | 'inactive';
}

const GuardHomeScreen: React.FC = () => {
  const navigation = useNavigation<GuardHomeScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Redux state
  const { 
    stats, 
    activeShift, 
    upcomingShifts, 
    loading, 
    error,
    checkInLoading,
    checkOutLoading,
  } = useSelector((state: RootState) => state.shifts);
  
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Use Redux data or fallback to default stats
  const statistics = stats || {
    completedShifts: 0,
    missedShifts: 0,
    totalSites: 0,
    incidentReports: 0,
    totalHours: 0,
  };

  // Initialize data and set up timer
  useEffect(() => {
    initializeData();

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
  }, []);

  // Refresh data when component comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      initializeData();
    });
    return unsubscribe;
  }, [navigation]);

  const initializeData = async () => {
    try {
        await Promise.all([
        dispatch(fetchShiftStatistics({})),
        dispatch(fetchActiveShift()),
        dispatch(fetchUpcomingShifts()),
        ]);
    } catch (error) {
      console.error('Error initializing dashboard data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(refreshDashboardData());
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Get current GPS location with retry logic - using safe location helper
  const getCurrentLocation = async (retries: number = 2): Promise<{ latitude: number; longitude: number; accuracy: number; address?: string }> => {
    return await getCurrentLocationWithRetry(retries);
  };

  const handleCheckIn = async () => {
    if (!activeShift) {
      // If no active shift, check if there's an upcoming shift to check in to
      if (upcomingShifts && upcomingShifts.length > 0) {
        const nextShift = upcomingShifts[0];
        Alert.alert(
          'No Active Shift',
          `You have an upcoming shift at ${nextShift.locationName} starting at ${new Date(nextShift.startTime).toLocaleTimeString()}. Would you like to check in early?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Check In Early', 
              onPress: () => handleCheckInToShift(nextShift.id)
            },
          ]
        );
      } else {
        Alert.alert('No Shift Available', 'You do not have any active or upcoming shifts to check in to.');
      }
      return;
    }

    await handleCheckInToShift(activeShift.id);
  };

  const handleCheckInToShift = async (shiftId: string) => {
    // Prevent multiple simultaneous requests
    if (gettingLocation || checkInLoading) {
      console.log('Check-in already in progress, skipping...');
      return;
    }

    try {
      setGettingLocation(true);
      
      // Add a small delay to ensure UI is ready before calling location service
      // This prevents crashes in release builds
      await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
      
      // Get GPS location with retry logic
      let location;
      try {
        location = await getCurrentLocation(2); // Retry up to 2 times
      } catch (locationError: any) {
        console.error('Location error in check-in:', locationError);
        // If location fails, show specific error and don't proceed with check-in
        const locationErrorMessage = locationError?.message || 'Unable to get your location. Please enable GPS and try again.';
        Alert.alert(
          'Location Required',
          locationErrorMessage,
          [
            { 
              text: 'Retry', 
              onPress: () => {
                // Retry getting location after a short delay
                setTimeout(() => {
                  handleCheckInToShift(shiftId);
                }, 500);
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setGettingLocation(false);
        return;
      }
      
      // Validate location data before proceeding
      if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        Alert.alert(
          'Invalid Location',
          'Unable to get valid location data. Please try again.',
          [{ text: 'OK' }]
        );
        setGettingLocation(false);
        return;
      }
      
      // Dispatch check-in action
      await dispatch(checkInToShiftWithLocation({
        shiftId,
        location,
      })).unwrap();

      Alert.alert('Success', 'You have successfully checked in!');
      
      // Refresh data
      await dispatch(fetchActiveShift());
      await dispatch(fetchShiftStatistics({}));
    } catch (error: any) {
      console.error('Check-in error:', error);
      // Handle check-in API errors separately from location errors
      const errorMessage = error?.message || 'Failed to check in. Please try again.';
      Alert.alert(
        'Check-In Failed',
        errorMessage,
        [
          { 
            text: 'Retry', 
            onPress: () => handleCheckInToShift(shiftId)
          },
          { text: 'OK' }
        ]
      );
    } finally {
      setGettingLocation(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeShift) {
      Alert.alert('No Active Shift', 'You do not have an active shift to check out from.');
      return;
    }

    // Prevent multiple simultaneous requests
    if (gettingLocation || checkOutLoading) {
      console.log('Check-out already in progress, skipping...');
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
              
              // Add a small delay to ensure UI is ready before calling location service
              await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
              
              // Get GPS location with retry logic
              let location;
              try {
                location = await getCurrentLocation(2); // Retry up to 2 times
              } catch (locationError: any) {
                // If location fails, show specific error and don't proceed with check-out
                const locationErrorMessage = locationError?.message || 'Unable to get your location. Please enable GPS and try again.';
                Alert.alert(
                  'Location Required',
                  locationErrorMessage,
                  [
                    { 
                      text: 'Retry', 
                      onPress: () => {
                        // Retry getting location after a short delay
                        setTimeout(() => {
                          handleCheckOut();
                        }, 500);
                      }
                    },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
                setGettingLocation(false);
                return;
              }
              
              // Dispatch check-out action
              await dispatch(checkOutFromShiftWithLocation({
                shiftId: activeShift.id,
                location,
              })).unwrap();

              Alert.alert('Success', 'You have successfully checked out!');
              
              // Refresh data
              await dispatch(fetchActiveShift());
              await dispatch(fetchShiftStatistics({}));
            } catch (error: any) {
              // Handle check-out API errors separately from location errors
              const errorMessage = error?.message || 'Failed to check out. Please try again.';
              Alert.alert(
                'Check-Out Failed',
                errorMessage,
                [
                  { 
                    text: 'Retry', 
                    onPress: () => handleCheckOut()
                  },
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

  const handleViewLocation = () => {
    if (activeShift) {
      // Navigate to site details if available, otherwise just show alert
      if (activeShift.locationId) {
        (navigation as any).navigate('GuardSiteDetails', { 
          siteId: activeShift.locationId,
          shiftId: activeShift.id 
        });
      } else {
        Alert.alert('Location', `Location: ${activeShift.locationName}\nAddress: ${activeShift.locationAddress}`);
      }
    } else {
      Alert.alert('No Active Shift', 'You do not have an active shift to view location for.');
    }
  };

  const handleIncidentReport = () => {
    if (activeShift) {
      (navigation as any).navigate('AddIncidentReport', { shiftId: activeShift.id });
    } else {
      Alert.alert('No Active Shift', 'You need to have an active shift to report an incident.');
    }
  };

  const handleEmergencyAlert = async () => {
    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to send an emergency alert? This will notify all supervisors, administrators, and clients.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Alert', 
          style: 'destructive',
          onPress: async () => {
            try {
              setGettingLocation(true);
              
              // Add a small delay to ensure UI is ready
              await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
              
              // Get current location with retry logic - wrapped in try-catch
              let location;
              try {
                location = await getCurrentLocation(1); // Quick retry for emergency
                
                // Validate location data
                if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
                  throw new Error('Invalid location data');
                }
              } catch (locationError: any) {
                // For emergency, use default location if GPS unavailable
                console.warn('Could not get location for emergency:', locationError);
                location = {
                  latitude: 0,
                  longitude: 0,
                  accuracy: 1000, // Low accuracy if GPS unavailable
                  address: 'Location unavailable - Emergency alert sent'
                };
              }

              // Trigger emergency alert with shiftId if available
              const result = await apiService.triggerEmergencyAlert({
                type: 'PANIC',
                severity: 'CRITICAL',
                location: {
                  latitude: location.latitude || 0,
                  longitude: location.longitude || 0,
                  accuracy: location.accuracy || 1000,
                  address: location.address || 'Emergency location'
                },
                message: `Emergency alert triggered by ${user?.firstName || 'Guard'} ${user?.lastName || ''}`,
                shiftId: activeShift?.id // Include shiftId to notify correct client/admin
              });

              if (result.success) {
                Alert.alert(
                  'Emergency Alert Sent', 
                  'Help is on the way! All supervisors, administrators, and clients have been notified.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Error', 
                  result.message || 'Failed to send emergency alert. Please try again or contact emergency services directly.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              console.error('Emergency alert error:', error);
              // Even if there's an error, try to send with default location
              try {
                const result = await apiService.triggerEmergencyAlert({
                  type: 'PANIC',
                  severity: 'CRITICAL',
                  location: {
                    latitude: 0,
                    longitude: 0,
                    accuracy: 1000,
                    address: 'Location unavailable - Emergency alert sent'
                  },
                  message: `Emergency alert triggered by ${user?.firstName || 'Guard'} ${user?.lastName || ''}`,
                  shiftId: activeShift?.id
                });

                if (result.success) {
                  Alert.alert(
                    'Emergency Alert Sent', 
                    'Help is on the way! Alert sent with limited location data.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert(
                    'Error', 
                    'Failed to send emergency alert. Please contact emergency services directly (call 911 or your local emergency number).',
                    [{ text: 'OK' }]
                  );
                }
              } catch (fallbackError: any) {
                console.error('Emergency alert fallback error:', fallbackError);
                Alert.alert(
                  'Critical Error', 
                  'Unable to send emergency alert through the app. Please contact emergency services directly (call 911 or your local emergency number).',
                  [{ text: 'OK' }]
                );
              }
            } finally {
              setGettingLocation(false);
            }
          }
        },
      ]
    );
  };

  const handleNotificationPress = () => {
    (navigation as any).navigate('Notifications');
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

  const renderStatsSection = () => (
    <View style={styles.statsSection}>
      {/* <Text style={styles.sectionTitle}>This Month Shifts</Text> */}
      <AppStatGrid style={styles.statsGrid}>
        <StatsCard
          label="Completed Shifts"
          value={statistics.completedShifts}
          icon={<CheckCircleIcon size={18} color={COLORS.success} />}
          variant="success"
          style={styles.statCard}
        />
        <StatsCard
          label="Total Hours"
          value={Math.round((statistics as any).totalHours || 0)}
          icon={<ClockIcon size={18} color={COLORS.info} />}
          variant="info"
          style={styles.statCard}
        />
        <StatsCard
          label="Active Sites"
          value={statistics.totalSites}
          icon={<MapPinIcon size={18} color={COLORS.primary} />}
                variant="info"
          style={styles.statCard}
        />
        <StatsCard
          label="Incident Reported"
          value={statistics.incidentReports}
          icon={<AlertTriangleIcon size={18} color={COLORS.textSecondary} />}
          variant="neutral"
          style={styles.statCard}
        />
      </AppStatGrid>
    </View>
  );

  const renderTodayShift = () => {
    // Show active shift if available, otherwise show next upcoming shift
    const displayShift = activeShift || (upcomingShifts && upcomingShifts.length > 0 ? upcomingShifts[0] : null);
    
    if (!displayShift) {
      return (
    <View style={styles.shiftSection}>
      <Text style={styles.sectionTitle}>Today's Shifts</Text>
          <AppCard style={styles.shiftCard}>
            <View style={styles.emptyShiftContainer}>
              <ClockIcon size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyShiftText}>No shifts scheduled for today</Text>
              <Text style={styles.emptyShiftSubtext}>Check back later for new assignments</Text>
            </View>
          </AppCard>
        </View>
      );
    }

    const isActive = activeShift?.id === displayShift.id;
    const isCheckedIn = !!displayShift.checkInTime;
    const isCheckedOut = !!displayShift.checkOutTime;

    return (
      <View style={styles.shiftSection}>
        <Text style={styles.sectionTitle}>
          {isActive ? 'Active Shift' : 'Upcoming Shift'}
        </Text>
      <AppCard style={styles.shiftCard}>
        <View style={styles.shiftHeader}>
          <View style={styles.locationInfo}>
            <View style={styles.locationIconContainer}>
            <MapPinIcon size={20} color={COLORS.primary} style={styles.locationIcon} />
            </View>
              <View style={styles.flex1}>
                <Text style={styles.locationName}>{displayShift.locationName}</Text>
                <Text style={styles.locationAddress}>{displayShift.locationAddress}</Text>
            </View>
          </View>
            {isActive && (
          <TouchableOpacity style={styles.viewLocationButton} onPress={handleViewLocation}>
            <Text style={styles.viewLocationText}>View Location</Text>
          </TouchableOpacity>
            )}
        </View>
        
          {displayShift.description && (
            <Text style={styles.shiftDescription}>{displayShift.description}</Text>
          )}
        
        <View style={styles.shiftDetails}>
          <View style={styles.shiftDetailRow}>
              <Text style={styles.shiftDetailLabel}>Shift Time:</Text>
              <Text style={styles.shiftDetailValue}>
                {formatTime(displayShift.startTime)} - {formatTime(displayShift.endTime)}
              </Text>
          </View>
            {displayShift.breakStartTime && displayShift.breakEndTime && (
          <View style={styles.shiftDetailRow}>
            <Text style={styles.shiftDetailLabel}>Break Time:</Text>
                <Text style={styles.shiftDetailValue}>
                  {formatTime(displayShift.breakStartTime)} - {formatTime(displayShift.breakEndTime)}
                </Text>
          </View>
            )}
            {isCheckedIn && (
          <View style={styles.shiftDetailRow}>
                <Text style={styles.shiftDetailLabel}>Duration:</Text>
                <Text style={styles.shiftDetailValue}>{calculateShiftDuration(displayShift)}</Text>
          </View>
            )}
            {isCheckedIn && (
              <View style={styles.shiftDetailRow}>
                <Text style={styles.shiftDetailLabel}>Checked In:</Text>
                <Text style={styles.shiftDetailValue}>
                  {displayShift.checkInTime ? formatTime(displayShift.checkInTime) : 'N/A'}
                </Text>
              </View>
            )}
        </View>

          {isActive && isCheckedIn && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{currentTime}</Text>
              <Text style={styles.timerLabel}>Active Shift Timer</Text>
        </View>
          )}

          {!isCheckedOut && (
            <TouchableOpacity 
              style={[
                styles.checkInButton, 
                (checkInLoading || gettingLocation) && styles.buttonDisabled
              ]} 
              onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
              disabled={checkInLoading || checkOutLoading || gettingLocation}
            >
              {(checkInLoading || checkOutLoading || gettingLocation) ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <>
          <ClockIcon size={24} color={COLORS.textInverse} style={styles.checkInIcon} />
                  <Text style={styles.checkInText}>
                    {isCheckedIn ? 'Check Out' : 'Check In'}
                  </Text>
                </>
              )}
        </TouchableOpacity>
          )}

          {isCheckedIn && !isCheckedOut && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.incidentButton} onPress={handleIncidentReport}>
            <AlertTriangleIcon size={20} color={COLORS.textInverse} style={styles.incidentIcon} />
                <Text style={styles.incidentText}>Report Incident</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyAlert}>
            <AlertCircleIcon size={20} color={COLORS.textInverse} style={styles.emergencyIcon} />
                <Text style={styles.emergencyText}>Emergency</Text>
          </TouchableOpacity>
        </View>
          )}

          {isCheckedOut && (
            <View style={styles.completedContainer}>
              <CheckCircleIcon size={24} color={COLORS.success} />
              <Text style={styles.completedText}>Shift Completed</Text>
              <Text style={styles.completedSubtext}>
                Checked out at {displayShift.checkOutTime ? formatTime(displayShift.checkOutTime) : 'N/A'}
              </Text>
            </View>
          )}
      </AppCard>
    </View>
  );
  };

  const renderUpcomingShifts = () => {
    if (!upcomingShifts || upcomingShifts.length === 0) {
      return null;
    }

    // Filter out the shift that's already displayed as active/next
    const displayShifts = upcomingShifts.filter(
      shift => !activeShift || shift.id !== activeShift.id
    ).slice(0, 3);

    if (displayShifts.length === 0) {
      return null;
    }

    return (
    <View style={styles.notificationsSection}>
        <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
        {displayShifts.map((shift) => (
          <TouchableOpacity 
            key={shift.id} 
            style={styles.notificationItem}
            onPress={() => {
              // Navigate to parent stack navigator
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('ShiftDetails', { shiftId: shift.id });
              } else {
                navigation.navigate('ShiftDetails', { shiftId: shift.id });
              }
            }}
          >
          <View style={styles.notificationAvatar}>
              <MapPinIcon size={24} color={COLORS.primary} />
          </View>
          <View style={styles.notificationContent}>
              <Text style={styles.notificationUser}>{shift.locationName}</Text>
              <Text style={styles.notificationAction}>
                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
              </Text>
              <Text style={styles.notificationSite}>{shift.locationAddress}</Text>
          </View>
          <View style={styles.notificationStatus}>
              <Text style={styles.statusText}>
                {new Date(shift.startTime).toLocaleDateString()}
              </Text>
          </View>
          </TouchableOpacity>
      ))}
    </View>
  );
  };

  // Show error state if there's an error and no data
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  // Check if it's a network error
  const isNetworkError = error?.toLowerCase().includes('network') || 
                         error?.toLowerCase().includes('connection') ||
                         error?.toLowerCase().includes('econnrefused') ||
                         error?.toLowerCase().includes('enotfound');

  if (error && !activeShift && !upcomingShifts?.length) {
    return (
      <AppScreen>
        <SharedHeader
          variant="guard"
          showLogo={true}
          onNotificationPress={handleNotificationPress}
          profileDrawer={
            <GuardProfileDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onNavigateToProfile={() => {
                closeDrawer();
                // Navigate to profile/settings when available
              }}
              onNavigateToPastJobs={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToAssignedSites={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToAttendance={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToNotifications={() => {
                closeDrawer();
                // Navigate to notifications/settings
              }}
              onNavigateToSupport={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
            />
          }
        />
        {isNetworkError ? (
          <NetworkError
            onRetry={initializeData}
            style={styles.errorContainer}
          />
        ) : (
          <ErrorState
            error={error}
            onRetry={initializeData}
            style={styles.errorContainer}
          />
        )}
      </AppScreen>
    );
  }

  return (
    <AppScreen>
        <SharedHeader
          variant="guard"
          showLogo={true}
          onNotificationPress={handleNotificationPress}
          profileDrawer={
            <GuardProfileDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onNavigateToProfile={() => {
                closeDrawer();
                // Navigate to profile/settings when available
              }}
              onNavigateToPastJobs={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToAssignedSites={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToAttendance={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
              onNavigateToNotifications={() => {
                closeDrawer();
                // Navigate to notifications/settings
              }}
              onNavigateToSupport={() => {
                closeDrawer();
                // Navigation handled in drawer
              }}
            />
          }
        />
      
      {/* Loading overlay for initial load */}
      <LoadingOverlay
        visible={loading && !activeShift && !upcomingShifts?.length}
        message="Loading dashboard..."
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && (activeShift || upcomingShifts?.length) ? (
          <InlineLoading message="Updating data..." style={styles.inlineLoading} />
        ) : null}
        
        {renderStatsSection()}
        {renderTodayShift()}
        {renderUpcomingShifts()}
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textPrimary,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  logoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  brandText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  logoImage: {
    width: 120,
    height: 30,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  statsSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  shiftSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  shiftCard: {
    padding: SPACING.lg,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginTop: 4,
  },
  locationIcon: {
    // Icon size is handled by the component
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  viewLocationButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  viewLocationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  shiftDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  shiftDetails: {
    marginBottom: SPACING.lg,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  shiftDetailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  shiftDetailValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  timerContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  checkInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
  },
  checkInIcon: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginRight: SPACING.sm,
  },
  checkInText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  clockedInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  clockedText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  clockedSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  incidentIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
  },
  incidentText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
  },
  emergencyIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.sm,
  },
  emergencyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  notificationsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  notificationContent: {
    flex: 1,
  },
  notificationUser: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  notificationAction: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  notificationSite: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  notificationStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  inlineLoading: {
    marginVertical: SPACING.md,
  },
  flex1: {
    flex: 1,
  },
  emptyShiftContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyShiftText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyShiftSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
  },
  completedText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  completedSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  timerLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default GuardHomeScreen;
