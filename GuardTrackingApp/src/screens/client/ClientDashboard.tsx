import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { MenuIcon, NotificationIcon, UserIcon, LocationIcon, ReportsIcon, EmergencyIcon } from '../../components/ui/AppIcons';
import StatsCard from '../../components/client/StatsCard';
import GuardCard from '../../components/client/GuardCard';
import { fetchDashboardStats, fetchMyGuards } from '../../store/slices/clientSlice';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';

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
  const { dashboardStats, guards, loading, guardsLoading } = useSelector((state: RootState) => state.client);
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchMyGuards({ page: 1, limit: 10 }));
  }, [dispatch]);

  const handleAssignNewShift = () => {
    console.log('Assign new shift');
  };

  const handleGuardPress = (guardId: string) => {
    console.log('Guard pressed:', guardId);
  };

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <MenuIcon size={24} color="#333" />
        </TouchableOpacity>
        <Image 
          source={require('../../assets/images/tracSOpro-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('ClientNotifications')}>
          <NotificationIcon size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statsColumn}>
              <StatsCard
                title="Guards On Duty"
                value={dashboardStats?.guardsOnDuty || 0}
                icon={<UserIcon size={24} color="#2E7D32" />}
                color="#2E7D32"
              />
            </View>
            <View style={styles.statsColumn}>
              <StatsCard
                title="Missed Shifts"
                value={dashboardStats?.missedShifts || 0}
                icon={<EmergencyIcon size={24} color="#D32F2F" />}
                color="#D32F2F"
              />
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsColumn}>
              <StatsCard
                title="Active Sites"
                value={dashboardStats?.activeSites || 0}
                icon={<LocationIcon size={24} color="#1976D2" />}
                color="#1976D2"
              />
            </View>
            <View style={styles.statsColumn}>
              <StatsCard
                title="New Reports"
                value={dashboardStats?.newReports || 0}
                icon={<ReportsIcon size={24} color="#FF9500" />}
                color="#FF9500"
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

        {/* Map Section */}
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Live Guards Location</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>Map View</Text>
            <Text style={styles.onlineText}>• 5 Online</Text>
          </View>
        </View>

        {/* Today's Shifts Summary */}
        <View style={styles.shiftsSection}>
          <Text style={styles.sectionTitle}>Todays Shifts Summary</Text>
          <View style={styles.shiftsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>GUARD</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>SITE</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>SHIFT TIME</Text>
              <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>STATUS</Text>
            </View>
            {guards && guards.length > 0 ? guards.map((guard) => (
              <GuardCard
                key={guard.id}
                guard={guard}
                onPress={() => handleGuardPress(guard.id)}
              />
            )) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No guards data available</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statsColumn: {
    flex: 1,
    marginHorizontal: 6,
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
  shiftsTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'left',
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
});

export default ClientDashboard;
