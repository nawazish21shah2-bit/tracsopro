import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import GuardAppHeader from '../../components/ui/GuardAppHeader';
import EmergencyButton from '../../components/emergency/EmergencyButton';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';
import {
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
} from 'react-native-feather';

type GuardHomeScreenNavigationProp = StackNavigationProp<GuardStackParamList>;

const GuardHomeScreen: React.FC = () => {
  const navigation = useNavigation<GuardHomeScreenNavigationProp>();

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'View your notifications');
  };

  const handleNavigateToProfile = () => {
    Alert.alert('Profile', 'Navigate to profile screen');
  };

  const handleNavigateToPastJobs = () => {
    Alert.alert('Past Jobs', 'Navigate to past jobs screen');
  };

  const handleNavigateToAssignedSites = () => {
    Alert.alert('Assigned Sites', 'Navigate to assigned sites screen');
  };

  const handleNavigateToAttendance = () => {
    Alert.alert('Attendance', 'Navigate to attendance screen');
  };

  const handleNavigateToNotifications = () => {
    Alert.alert('Notification Settings', 'Navigate to notification settings');
  };

  const handleNavigateToSupport = () => {
    Alert.alert('Support', 'Navigate to support screen');
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
          <Clock width={24} height={24} color="#1C6CA9" />
          <Text style={styles.quickActionText}>Check In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <MapPin width={24} height={24} color="#10B981" />
          <Text style={styles.quickActionText}>View Sites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <Calendar width={24} height={24} color="#F59E0B" />
          <Text style={styles.quickActionText}>My Shifts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <AlertTriangle width={24} height={24} color="#EF4444" />
          <Text style={styles.quickActionText}>Report</Text>
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
          {renderStatsCard(
            'Completed Shifts',
            '24',
            <CheckCircle width={20} height={20} color="#10B981" />,
            '#10B981'
          )}
          {renderStatsCard(
            'Total Hours',
            '156',
            <Clock width={20} height={20} color="#1C6CA9" />,
            '#1C6CA9'
          )}
          {renderStatsCard(
            'Active Sites',
            '8',
            <MapPin width={20} height={20} color="#6366F1" />,
            '#6366F1'
          )}
          {renderStatsCard(
            'Team Members',
            '12',
            <Users width={20} height={20} color="#F59E0B" />,
            '#F59E0B'
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
                <CheckCircle width={16} height={16} color="#10B981" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Shift Completed</Text>
                <Text style={styles.activitySubtitle}>Metro Hospital Complex</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <AlertTriangle width={16} height={16} color="#F59E0B" />
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
    backgroundColor: '#F8F9FA',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  statsTitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  currentShiftSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  currentShiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
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
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  shiftAddress: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  shiftTiming: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shiftTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  shiftDuration: {
    fontSize: 14,
    color: '#666666',
  },
  checkOutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  recentActivitySection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#999999',
  },
  emergencySection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },
  emergencySubtext: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default GuardHomeScreen;
