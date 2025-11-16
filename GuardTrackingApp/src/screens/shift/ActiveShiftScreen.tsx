/**
 * Active Shift Screen with Live Timer
 * Real-time shift monitoring with break management and emergency features
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
  Vibration,
  BackHandler,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { 
  endBreak, 
  startBreak, 
  fetchActiveShift,
  createIncidentReport 
} from '../../store/slices/shiftSlice';
import { AppScreen } from '../../components/common/AppScreen';
import { AppHeader } from '../../components/common/AppHeader';
import { AppCard } from '../../components/common/AppCard';
import { LoadingOverlay } from '../../components/ui/LoadingStates';
import {
  PlayIcon,
  PauseIcon,
  AlertTriangleIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CameraIcon,
  FileTextIcon,
  MessageCircleIcon,
} from '../../components/ui/FeatherIcons';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import locationTrackingService from '../../services/locationTrackingService';
import notificationService from '../../services/notificationService';
import WebSocketService from '../../services/WebSocketService';
import { ErrorHandler } from '../../utils/errorHandler';

interface ActiveShiftScreenProps {
  navigation: any;
  route: any;
}

const ActiveShiftScreen: React.FC<ActiveShiftScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { activeShift, currentBreak, loading, error } = useSelector((state: RootState) => state.shifts);
  const { currentLocation, isTracking } = useSelector((state: RootState) => state.locations);
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakElapsedTime, setBreakElapsedTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isBreakTimerActive, setIsBreakTimerActive] = useState(false);
  
  // Component state
  const [emergencyPressed, setEmergencyPressed] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  
  // Refs for timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize timers and tracking
  useEffect(() => {
    if (activeShift) {
      const shiftStartTime = new Date(activeShift.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - shiftStartTime) / 1000);
      setElapsedTime(elapsed);
      setIsTimerActive(true);

      // Start location tracking if not already active
      if (!isTracking) {
        locationTrackingService.startTracking(activeShift.id);
      }
    }

    if (currentBreak && !currentBreak.endTime) {
      const breakStartTime = new Date(currentBreak.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - breakStartTime) / 1000);
      setBreakElapsedTime(elapsed);
      setIsBreakTimerActive(true);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
      if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current);
    };
  }, [activeShift, currentBreak, isTracking]);

  // Main shift timer
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive]);

  // Break timer
  useEffect(() => {
    if (isBreakTimerActive) {
      breakTimerRef.current = setInterval(() => {
        setBreakElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    }

    return () => {
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    };
  }, [isBreakTimerActive]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && activeShift) {
        // Send background notification
        notificationService.sendImmediateNotification(
          'Shift Active',
          `Shift timer: ${formatTime(elapsedTime)}`,
          { type: 'shift_background', shiftId: activeShift.id }
        );
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [activeShift, elapsedTime]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (activeShift) {
          Alert.alert(
            'Active Shift',
            'You have an active shift. Are you sure you want to leave this screen?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Leave', onPress: () => navigation.goBack() },
            ]
          );
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [activeShift, navigation])
  );

  // Location update tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const lastLocation = locationTrackingService.getLastKnownLocation();
      if (lastLocation) {
        setLastLocationUpdate(new Date(lastLocation.timestamp));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartBreak = async () => {
    try {
      if (!activeShift) return;

      const location = locationTrackingService.getLastKnownLocation();
      if (!location) {
        Alert.alert('Location Required', 'Unable to get current location for break start.');
        return;
      }

      await dispatch(startBreak({
        shiftId: activeShift.id,
        type: 'regular',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      }) as any);

      setIsTimerActive(false);
      setBreakElapsedTime(0);
      setIsBreakTimerActive(true);

      // Send WebSocket update
      WebSocketService.sendShiftStatusUpdate({
        guardId: activeShift.guardId,
        shiftId: activeShift.id,
        status: 'ON_BREAK',
        location: {
          guardId: activeShift.guardId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        },
      });

      await notificationService.sendImmediateNotification(
        'Break Started',
        'Your break timer is now active',
        { type: 'break_started', shiftId: activeShift.id }
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'start_break');
      Alert.alert('Error', 'Failed to start break. Please try again.');
    }
  };

  const handleEndBreak = async () => {
    try {
      if (!currentBreak) return;

      await dispatch(endBreak(currentBreak.id) as any);

      setIsBreakTimerActive(false);
      setIsTimerActive(true);

      // Send WebSocket update
      if (activeShift) {
        const location = locationTrackingService.getLastKnownLocation();
        WebSocketService.sendShiftStatusUpdate({
          guardId: activeShift.guardId,
          shiftId: activeShift.id,
          status: 'ACTIVE',
          location: location ? {
            guardId: activeShift.guardId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          } : undefined,
        });
      }

      await notificationService.sendImmediateNotification(
        'Break Ended',
        `Break duration: ${formatTime(breakElapsedTime)}`,
        { type: 'break_ended', duration: breakElapsedTime }
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'end_break');
      Alert.alert('Error', 'Failed to end break. Please try again.');
    }
  };

  const handleEmergencyAlert = async () => {
    try {
      setEmergencyPressed(true);
      Vibration.vibrate([0, 500, 200, 500]);

      // 3-second countdown before sending alert
      let countdown = 3;
      const countdownAlert = Alert.alert(
        '🚨 EMERGENCY ALERT',
        `Sending emergency alert in ${countdown} seconds...\n\nPress Cancel to abort.`,
        [
          {
            text: 'CANCEL',
            style: 'cancel',
            onPress: () => {
              setEmergencyPressed(false);
              if (emergencyTimeoutRef.current) {
                clearTimeout(emergencyTimeoutRef.current);
              }
            },
          },
        ]
      );

      const updateCountdown = () => {
        countdown--;
        if (countdown > 0) {
          Alert.dismiss();
          Alert.alert(
            '🚨 EMERGENCY ALERT',
            `Sending emergency alert in ${countdown} seconds...\n\nPress Cancel to abort.`,
            [
              {
                text: 'CANCEL',
                style: 'cancel',
                onPress: () => {
                  setEmergencyPressed(false);
                  if (emergencyTimeoutRef.current) {
                    clearTimeout(emergencyTimeoutRef.current);
                  }
                },
              },
            ]
          );
          emergencyTimeoutRef.current = setTimeout(updateCountdown, 1000);
        } else {
          Alert.dismiss();
          sendEmergencyAlert();
        }
      };

      emergencyTimeoutRef.current = setTimeout(updateCountdown, 1000);
    } catch (error) {
      ErrorHandler.handleError(error, 'emergency_alert_init');
      setEmergencyPressed(false);
    }
  };

  const sendEmergencyAlert = async () => {
    try {
      const location = locationTrackingService.getLastKnownLocation();
      if (!location) {
        Alert.alert('Error', 'Unable to get location for emergency alert.');
        setEmergencyPressed(false);
        return;
      }

      // Send emergency alert via WebSocket
      WebSocketService.sendEmergencyAlert({
        guardId: activeShift?.guardId || 'unknown',
        location: {
          guardId: activeShift?.guardId || 'unknown',
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        },
        message: 'Emergency alert triggered from active shift',
      });

      // Send emergency notification
      await notificationService.sendEmergencyAlert(
        'EMERGENCY: Guard needs immediate assistance',
        {
          latitude: location.latitude,
          longitude: location.longitude,
          guardId: activeShift?.guardId,
          shiftId: activeShift?.id,
        }
      );

      // Create incident report
      if (activeShift) {
        await dispatch(createIncidentReport({
          type: 'emergency',
          description: 'Emergency alert triggered by guard',
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: 'Current location',
          },
          severity: 'critical',
          shiftId: activeShift.id,
        }) as any);
      }

      Alert.alert(
        '🚨 EMERGENCY ALERT SENT',
        'Emergency services and supervisors have been notified. Help is on the way.',
        [{ text: 'OK' }]
      );

      setEmergencyPressed(false);
    } catch (error) {
      ErrorHandler.handleError(error, 'send_emergency_alert');
      Alert.alert('Error', 'Failed to send emergency alert. Please call emergency services directly.');
      setEmergencyPressed(false);
    }
  };

  const handleQuickIncident = () => {
    navigation.navigate('AddIncidentReport', { 
      shiftId: activeShift?.id,
      quickReport: true 
    });
  };

  const handleTakePhoto = () => {
    navigation.navigate('CameraScreen', { 
      shiftId: activeShift?.id,
      purpose: 'shift_documentation' 
    });
  };

  const handleOpenChat = () => {
    navigation.navigate('ChatScreen', { 
      roomId: 'support',
      roomName: 'Support Chat'
    });
  };

  const getLocationStatus = () => {
    if (!lastLocationUpdate) return { color: COLORS.error, text: 'No location' };
    
    const timeSinceUpdate = Date.now() - lastLocationUpdate.getTime();
    if (timeSinceUpdate < 60000) return { color: COLORS.success, text: 'Live' };
    if (timeSinceUpdate < 300000) return { color: COLORS.warning, text: 'Recent' };
    return { color: COLORS.error, text: 'Stale' };
  };

  if (loading) {
    return (
      <AppScreen>
        <AppHeader title="Active Shift" showBack />
        <LoadingOverlay visible={true} message="Loading shift data..." />
      </AppScreen>
    );
  }

  if (!activeShift) {
    return (
      <AppScreen>
        <AppHeader title="Active Shift" showBack />
        <View style={styles.noShiftContainer}>
          <ClockIcon size={64} color={COLORS.textSecondary} />
          <Text style={styles.noShiftTitle}>No Active Shift</Text>
          <Text style={styles.noShiftText}>
            You don't have an active shift at the moment.
          </Text>
          <TouchableOpacity
            style={styles.startShiftButton}
            onPress={() => navigation.navigate('MyShifts')}
          >
            <Text style={styles.startShiftButtonText}>View Shifts</Text>
          </TouchableOpacity>
        </View>
      </AppScreen>
    );
  }

  const locationStatus = getLocationStatus();

  return (
    <AppScreen>
      <AppHeader title="Active Shift" showBack />
      
      <View style={styles.container}>
        {/* Main Timer Card */}
        <AppCard style={styles.timerCard}>
          <View style={styles.timerHeader}>
            <Text style={styles.shiftTitle}>{activeShift.site?.name || 'Active Shift'}</Text>
            <View style={[styles.statusDot, { backgroundColor: currentBreak ? COLORS.warning : COLORS.success }]} />
          </View>
          
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
            <Text style={styles.timerLabel}>
              {currentBreak ? 'On Break' : 'Shift Duration'}
            </Text>
          </View>

          {currentBreak && (
            <View style={styles.breakTimer}>
              <Text style={styles.breakTimerText}>{formatTime(breakElapsedTime)}</Text>
              <Text style={styles.breakTimerLabel}>Break Duration</Text>
            </View>
          )}

          <View style={styles.shiftInfo}>
            <Text style={styles.shiftInfoText}>
              Started: {new Date(activeShift.startTime).toLocaleTimeString()}
            </Text>
            <View style={styles.locationStatus}>
              <MapPinIcon size={16} color={locationStatus.color} />
              <Text style={[styles.locationStatusText, { color: locationStatus.color }]}>
                {locationStatus.text}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Break Controls */}
        <AppCard style={styles.controlsCard}>
          <Text style={styles.controlsTitle}>Break Management</Text>
          
          {!currentBreak ? (
            <TouchableOpacity
              style={styles.breakButton}
              onPress={handleStartBreak}
            >
              <PauseIcon size={24} color={COLORS.textInverse} />
              <Text style={styles.breakButtonText}>Start Break</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={handleEndBreak}
            >
              <PlayIcon size={24} color={COLORS.textInverse} />
              <Text style={styles.resumeButtonText}>End Break</Text>
            </TouchableOpacity>
          )}
        </AppCard>

        {/* Quick Actions */}
        <AppCard style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleQuickIncident}
            >
              <FileTextIcon size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleTakePhoto}
            >
              <CameraIcon size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ContactSupervisor')}
            >
              <PhoneIcon size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Emergency Button */}
        <TouchableOpacity
          style={[
            styles.emergencyButton,
            emergencyPressed && styles.emergencyButtonPressed
          ]}
          onPress={handleEmergencyAlert}
          disabled={emergencyPressed}
        >
          <AlertTriangleIcon size={32} color={COLORS.textInverse} />
          <Text style={styles.emergencyButtonText}>
            {emergencyPressed ? 'SENDING...' : 'EMERGENCY'}
          </Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  noShiftContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noShiftTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  noShiftText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  startShiftButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  startShiftButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  timerCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  shiftTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timerText: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  breakTimer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.warning + '20',
    borderRadius: 8,
  },
  breakTimerText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.warning,
    fontFamily: 'monospace',
  },
  breakTimerLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning,
    marginTop: SPACING.xs,
  },
  shiftInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  shiftInfoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationStatusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginLeft: SPACING.xs,
  },
  controlsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  controlsTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  breakButton: {
    backgroundColor: COLORS.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  breakButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  resumeButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  resumeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
  },
  actionsCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  actionsTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emergencyButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: 16,
    marginTop: 'auto',
    elevation: 8,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyButtonPressed: {
    backgroundColor: COLORS.error + 'CC',
    transform: [{ scale: 0.95 }],
  },
  emergencyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
    marginLeft: SPACING.sm,
    letterSpacing: 1,
  },
});

export default ActiveShiftScreen;
