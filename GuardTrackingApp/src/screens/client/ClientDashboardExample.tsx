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
import ClientAppHeader from '../../components/ui/ClientAppHeader';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import {
  MapPin,
  Users,
  FileText,
  BarChart,
  Calendar,
  Shield,
} from 'react-native-feather';

type ClientDashboardNavigationProp = StackNavigationProp<ClientStackParamList>;

const ClientDashboardExample: React.FC = () => {
  const navigation = useNavigation<ClientDashboardNavigationProp>();

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'View your notifications');
  };

  const handleNavigateToProfile = () => {
    Alert.alert('Profile', 'Navigate to profile screen');
  };

  const handleNavigateToSites = () => {
    Alert.alert('Sites', 'Navigate to sites management');
  };

  const handleNavigateToGuards = () => {
    Alert.alert('Guards', 'Navigate to guards management');
  };

  const handleNavigateToReports = () => {
    Alert.alert('Reports', 'Navigate to reports screen');
  };

  const handleNavigateToAnalytics = () => {
    Alert.alert('Analytics', 'Navigate to analytics screen');
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
        <TouchableOpacity style={styles.quickActionCard} onPress={handleNavigateToSites}>
          <MapPin width={24} height={24} color="#1C6CA9" />
          <Text style={styles.quickActionText}>Manage Sites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={handleNavigateToGuards}>
          <Users width={24} height={24} color="#10B981" />
          <Text style={styles.quickActionText}>Manage Guards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={handleNavigateToReports}>
          <FileText width={24} height={24} color="#F59E0B" />
          <Text style={styles.quickActionText}>View Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard} onPress={handleNavigateToAnalytics}>
          <BarChart width={24} height={24} color="#EF4444" />
          <Text style={styles.quickActionText}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaWrapper>
      <ClientAppHeader
        title="Dashboard"
        onNotificationPress={handleNotificationPress}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToSites={handleNavigateToSites}
        onNavigateToGuards={handleNavigateToGuards}
        onNavigateToReports={handleNavigateToReports}
        onNavigateToAnalytics={handleNavigateToAnalytics}
        onNavigateToNotifications={handleNavigateToNotifications}
        onNavigateToSupport={handleNavigateToSupport}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatsCard(
            'Active Sites',
            '12',
            <MapPin width={20} height={20} color="#1C6CA9" />,
            '#1C6CA9',
            handleNavigateToSites
          )}
          {renderStatsCard(
            'Guards on Duty',
            '28',
            <Users width={20} height={20} color="#10B981" />,
            '#10B981',
            handleNavigateToGuards
          )}
          {renderStatsCard(
            'Monthly Reports',
            '156',
            <FileText width={20} height={20} color="#F59E0B" />,
            '#F59E0B',
            handleNavigateToReports
          )}
          {renderStatsCard(
            'System Uptime',
            '99.8%',
            <Shield width={20} height={20} color="#6366F1" />,
            '#6366F1'
          )}
        </View>

        {/* Current Status */}
        <View style={styles.currentStatusSection}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Security Operations</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>All Systems Active</Text>
              </View>
            </View>
            <Text style={styles.statusDescription}>
              All security sites are operational with guards on duty. No incidents reported in the last 24 hours.
            </Text>
            <View style={styles.statusMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>28/30</Text>
                <Text style={styles.metricLabel}>Guards Active</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>12/12</Text>
                <Text style={styles.metricLabel}>Sites Covered</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>0</Text>
                <Text style={styles.metricLabel}>Incidents</Text>
              </View>
            </View>
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
                <Shield width={16} height={16} color="#10B981" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Guard Check-in</Text>
                <Text style={styles.activitySubtitle}>John Smith - Downtown Office</Text>
                <Text style={styles.activityTime}>5 minutes ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <FileText width={16} height={16} color="#1C6CA9" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Report Submitted</Text>
                <Text style={styles.activitySubtitle}>Daily patrol report - Mall Complex</Text>
                <Text style={styles.activityTime}>1 hour ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Calendar width={16} height={16} color="#F59E0B" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Shift Scheduled</Text>
                <Text style={styles.activitySubtitle}>Night shift - Hospital Complex</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
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
  currentStatusSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
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
  statusDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
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
});

export default ClientDashboardExample;
