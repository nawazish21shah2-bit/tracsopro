import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import GuardAppHeader from '../../components/ui/GuardAppHeader';
import EmergencyButton from '../../components/emergency/EmergencyButton';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';
import { AppDispatch, RootState } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchShiftStatistics, fetchActiveShift, fetchUpcomingShifts } from '../../store/slices/shiftSlice';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import {
  ClockIcon,
  LocationIcon,
  CheckCircleIcon,
  EmergencyIcon,
  ShiftsIcon,
  UsersIcon,
  LogoutIcon,
} from '../../components/ui/AppIcons';
import apiService from '../../services/api';

type GuardHomeScreenNavigationProp = StackNavigationProp<GuardStackParamList>;

const GuardHomeScreen: React.FC = () => {
  const navigation = useNavigation<GuardHomeScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { stats, activeShift, upcomingShifts, loading: shiftsLoading } = useSelector((state: RootState) => state.shifts);
  
  const [teamMembersCount, setTeamMembersCount] = useState<number>(0);
  const [activeSitesCount, setActiveSitesCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  
  // Fetch dashboard data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
      return () => {};
    }, [])
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      await Promise.all([
        dispatch(fetchShiftStatistics({})),
        dispatch(fetchActiveShift()),
        dispatch(fetchUpcomingShifts()),
        loadAdditionalStats(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadAdditionalStats = async () => {
    try {
      // Fetch active sites count (sites with active shifts)
      if (activeShift) {
        setActiveSitesCount(1);
      } else {
        // Count unique sites from upcoming shifts
        const sitesSet = new Set(upcomingShifts?.map(s => s.locationId || s.locationName).filter(Boolean) || []);
        setActiveSitesCount(sitesSet.size || 0);
      }

      // For team members, we could fetch from backend or use a placeholder
      // For now, use stats.totalSites as a proxy or fetch from API if available
      setTeamMembersCount(0); // Placeholder - can be enhanced with API call if available
    } catch (error) {
      console.error('Error loading additional stats:', error);
    }
  };

  // Calculate total hours from stats
  const totalHours = (stats as any)?.totalHours || 0;
  const completedShifts = stats?.completedShifts || 0;
  const activeSites = activeSitesCount || stats?.totalSites || 0;
  const teamMembers = teamMembersCount || 0;

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'View your notifications');
  };

  const handleNavigateToProfile = () => {
    navigation.navigate('GuardTabs', { screen: 'Profile' });
  };

  const handleNavigateToPastJobs = () => {
    navigation.navigate('GuardTabs', { screen: 'Jobs' });
  };

  const handleNavigateToAssignedSites = () => {
    navigation.navigate('GuardTabs', { screen: 'MyShifts' });
  };

  const handleNavigateToAttendance = () => {
    navigation.navigate('GuardTabs', { screen: 'Reports' });
  };

  const handleNavigateToNotifications = () => {
    navigation.navigate('GuardTabs', { screen: 'Profile' });
  };

  const handleNavigateToSupport = () => {
    // Navigate to chat or support screen when available
    navigation.navigate('ChatListScreen');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Dispatch logout action - this will handle API call, storage cleanup, and navigation
              await dispatch(logoutUser()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderStatsCard = (
    title: string,
    value: string,
    icon: React.ReactNode,
    color: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.statsCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.statsHeader}>
        <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.statsValue}>{value}</Text>
      </View>
      <Text style={styles.statsTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionCard}>
          <ClockIcon size={24} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Check In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <LocationIcon size={24} color={COLORS.success} />
          <Text style={styles.quickActionText}>View Sites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <ShiftsIcon size={24} color={COLORS.warning} />
          <Text style={styles.quickActionText}>My Shifts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <EmergencyIcon size={24} color={COLORS.error} />
          <Text style={styles.quickActionText}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={handleLogout}>
          <LogoutIcon size={24} color={COLORS.textSecondary} />
          <Text style={styles.quickActionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper>
      <GuardAppHeader
        title="Dashboard"
        onNotificationPress={handleNotificationPress}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToPastJobs={handleNavigateToPastJobs}
        onNavigateToAssignedSites={handleNavigateToAssignedSites}
        onNavigateToAttendance={handleNavigateToAttendance}
        onNavigateToNotifications={handleNavigateToNotifications}
        onNavigateToSupport={handleNavigateToSupport}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {loadingStats ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.statsCard, styles.statsCardLoading]}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ))}
            </>
          ) : (
            <>
              {renderStatsCard(
                'Completed Shifts',
                String(completedShifts || 0),
                <CheckCircleIcon size={20} color={COLORS.success} />,
                COLORS.success
              )}
              {renderStatsCard(
                'Total Hours',
                String(Math.round(totalHours || 0)),
                <ClockIcon size={20} color={COLORS.primary} />,
                COLORS.primary
              )}
              {renderStatsCard(
                'Active Sites',
                String(activeSites || 0),
                <LocationIcon size={20} color={COLORS.info} />,
                COLORS.info
              )}
              {renderStatsCard(
                'Team Members',
                String(teamMembers || 0),
                <UsersIcon size={20} color={COLORS.warning} />,
                COLORS.warning
              )}
            </>
          )}
        </View>

        {/* Emergency Button */}
        <View style={styles.emergencySection}>
          <EmergencyButton
            size="large"
            onEmergencyTriggered={(alertId) => {
              Alert.alert(
                'Emergency Alert Sent',
                `Emergency alert ${alertId} has been sent to administrators.`,
                [{ text: 'OK' }]
              );
            }}
          />
          <Text style={styles.emergencyText}>Emergency Alert</Text>
          <Text style={styles.emergencySubtext}>Tap for immediate assistance</Text>
        </View>

        {/* Current Shift Status */}
        <View style={styles.currentShiftSection}>
          <Text style={styles.sectionTitle}>Current Shift</Text>
          <View style={styles.currentShiftCard}>
            <View style={styles.shiftHeader}>
              <Text style={styles.shiftTitle}>Downtown Corporate Center</Text>
              <View style={styles.shiftStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <Text style={styles.shiftAddress}>456 Business Ave, New York, NY</Text>
            <View style={styles.shiftTiming}>
              <Text style={styles.shiftTime}>08:00 AM - 04:00 PM</Text>
              <Text style={styles.shiftDuration}>Started 2h 30m ago</Text>
            </View>
            <TouchableOpacity style={styles.checkOutButton}>
              <Text style={styles.checkOutButtonText}>Check Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        {renderQuickActions()}

        {/* Recent Activity */}
        <View style={styles.recentActivitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <CheckCircleIcon size={16} color="#10B981" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Shift Completed</Text>
                <Text style={styles.activitySubtitle}>Metro Hospital Complex</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <EmergencyIcon size={16} color={COLORS.warning} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Incident Reported</Text>
                <Text style={styles.activitySubtitle}>Parking area disturbance</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  statsCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  statsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  currentShiftSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  currentShiftCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  shiftStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  shiftAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  shiftTiming: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shiftTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  shiftDuration: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  checkOutButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  checkOutButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  quickActionsSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  recentActivitySection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  activityList: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  emergencySection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.error,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emergencySubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  statsCardLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
});

export default GuardHomeScreen;
