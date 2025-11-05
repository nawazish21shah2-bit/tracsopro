import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { NotificationIcon, ReportsIcon, LocationIcon, EmergencyIcon, UserIcon, CheckCircleIcon, AppIcon } from '../../components/ui/AppIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';

const ClientDashboardScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();

  const dashboardCards = [
    {
      title: 'Active Guards',
      value: '12',
      icon: 'people-outline',
      color: '#007AFF',
      description: 'Guards on duty'
    },
    {
      title: 'Incidents Today',
      value: '3',
      icon: 'alert-circle-outline',
      color: '#FF3B30',
      description: 'Reported incidents'
    },
    {
      title: 'Sites Monitored',
      value: '8',
      icon: 'location-outline',
      color: '#34C759',
      description: 'Active locations'
    },
    {
      title: 'Reports',
      value: '24',
      icon: 'document-text-outline',
      color: '#FF9500',
      description: 'This month'
    }
  ];

  const quickActions = [
    {
      title: 'View Guards',
      icon: 'people',
      color: '#007AFF',
      action: () => console.log('View Guards')
    },
    {
      title: 'Incident Reports',
      icon: 'alert-circle',
      color: '#FF3B30',
      action: () => console.log('Incident Reports')
    },
    {
      title: 'Site Management',
      icon: 'location',
      color: '#34C759',
      action: () => console.log('Site Management')
    },
    {
      title: 'Analytics',
      icon: 'analytics',
      color: '#FF9500',
      action: () => console.log('Analytics')
    }
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userRole}>Client Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('ClientNotifications')}>
          <NotificationIcon size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {dashboardCards.map((card, index) => (
          <TouchableOpacity key={index} style={styles.statsCard}>
            <View style={[styles.iconContainer, { backgroundColor: card.color + '20' }]}>
              {card.icon === 'people-outline' && <UserIcon size={22} color={card.color} />}
              {card.icon === 'alert-circle-outline' && <EmergencyIcon size={22} color={card.color} />}
              {card.icon === 'location-outline' && <LocationIcon size={22} color={card.color} />}
              {card.icon === 'document-text-outline' && <ReportsIcon size={22} color={card.color} />}
            </View>
            <View style={styles.statsContent}>
              <Text style={styles.statsValue}>{card.value}</Text>
              <Text style={styles.statsTitle}>{card.title}</Text>
              <Text style={styles.statsDescription}>{card.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.actionCard}
              onPress={action.action}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                {action.icon === 'people' && <UserIcon size={18} color={action.color} />}
                {action.icon === 'alert-circle' && <EmergencyIcon size={18} color={action.color} />}
                {action.icon === 'location' && <LocationIcon size={18} color={action.color} />}
                {action.icon === 'analytics' && (
                  <AppIcon type="material" name="insert-chart-outlined" size={18} color={action.color} />
                )}
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <CheckCircleIcon size={18} color="#34C759" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Guard checked in at Site A</Text>
              <Text style={styles.activityTime}>2 minutes ago</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <EmergencyIcon size={18} color="#FF9500" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Incident reported at Site B</Text>
              <Text style={styles.activityTime}>15 minutes ago</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <ReportsIcon size={18} color="#007AFF" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Daily report submitted</Text>
              <Text style={styles.activityTime}>1 hour ago</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '600',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 15,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statsDescription: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  activityContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default ClientDashboardScreen;
