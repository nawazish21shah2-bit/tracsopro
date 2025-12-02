import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Search, MapPin, Clock, DollarSign, Users, Filter } from 'react-native-feather';
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';

interface ShiftPosting {
  id: string;
  title: string;
  siteName: string;
  address: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  maxGuards: number;
  appliedGuards: number;
  requirements: string;
  description: string;
  clientName: string;
  distance: number; // in miles
  postedAt: string;
}

const AvailableShiftsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<GuardStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shifts, setShifts] = useState<ShiftPosting[]>([]);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'high-pay'>('all');

  useEffect(() => {
    loadAvailableShifts();
  }, []);

  const loadAvailableShifts = async () => {
    try {
      const result = await apiService.getAvailableShiftPostings(1, 50);
      
      if (result.success && result.data) {
        const shiftPostings = result.data.shiftPostings || result.data || [];
        
        // Transform API response to match ShiftPosting interface
        const transformedShifts: ShiftPosting[] = shiftPostings.map((sp: any) => ({
          id: sp.id,
          title: sp.title || 'Security Shift',
          siteName: sp.site?.name || sp.siteName || 'Site',
          address: sp.site?.address || sp.address || '',
          startTime: sp.startTime,
          endTime: sp.endTime,
          hourlyRate: sp.hourlyRate || 0,
          maxGuards: sp.maxGuards || 1,
          appliedGuards: sp.applications?.filter((app: any) => app.status === 'APPROVED').length || 0,
          requirements: sp.requirements || '',
          description: sp.description || '',
          clientName: sp.client?.user ? `${sp.client.user.firstName} ${sp.client.user.lastName}` : sp.clientName || 'Client',
          distance: sp.distance || 0, // Calculate distance if location available
          postedAt: sp.createdAt || sp.postedAt || new Date().toISOString()
        }));
        
        setShifts(transformedShifts);
      } else {
        // Fallback to empty array if API fails
        setShifts([]);
      }
    } catch (error: any) {
      console.error('Error loading shifts:', error);
      // Fallback to empty array on error
      setShifts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadAvailableShifts();
  }, []);

  const handleShiftPress = useCallback((shiftId: string) => {
    navigation.navigate('ShiftDetails', { shiftId });
  }, [navigation]);

  const handleApplyForShift = useCallback((shiftId: string) => {
    navigation.navigate('ApplyForShift', { shiftId });
  }, [navigation]);

  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const calculateDuration = useCallback((start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hours;
  }, []);

  const filteredShifts = useMemo(() => {
    switch (filter) {
      case 'nearby':
        return shifts.filter(shift => shift.distance <= 5);
      case 'high-pay':
        return shifts.filter(shift => shift.hourlyRate >= 25);
      default:
        return shifts;
    }
  }, [shifts, filter]);

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Shifts</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search width={20} height={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All Shifts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'nearby' && styles.filterTabActive]}
            onPress={() => setFilter('nearby')}
          >
            <Text style={[styles.filterText, filter === 'nearby' && styles.filterTextActive]}>
              Nearby (≤5mi)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'high-pay' && styles.filterTabActive]}
            onPress={() => setFilter('high-pay')}
          >
            <Text style={[styles.filterText, filter === 'high-pay' && styles.filterTextActive]}>
              High Pay ($25+)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1C6CA9" />
            <Text style={styles.loadingText}>Loading available shifts...</Text>
          </View>
        ) : filteredShifts.length > 0 ? (
          filteredShifts.map((shift) => (
            <TouchableOpacity 
              key={shift.id}
              style={styles.shiftCard}
              onPress={() => handleShiftPress(shift.id)}
            >
              <View style={styles.shiftHeader}>
                <View style={styles.shiftTitleContainer}>
                  <Text style={styles.shiftTitle}>{shift.title}</Text>
                  <Text style={styles.siteName}>{shift.siteName}</Text>
                </View>
                <View style={styles.rateContainer}>
                  <Text style={styles.hourlyRate}>${shift.hourlyRate}/hr</Text>
                  <Text style={styles.totalPay}>
                    ${(shift.hourlyRate * calculateDuration(shift.startTime, shift.endTime)).toFixed(0)} total
                  </Text>
                </View>
              </View>

              <View style={styles.shiftDetails}>
                <View style={styles.detailRow}>
                  <MapPin width={14} height={14} color="#666" />
                  <Text style={styles.detailText}>{shift.address}</Text>
                  <Text style={styles.distance}>{shift.distance}mi</Text>
                </View>

                <View style={styles.detailRow}>
                  <Clock width={14} height={14} color="#666" />
                  <Text style={styles.detailText}>
                    {formatDateTime(shift.startTime)} - {formatDateTime(shift.endTime)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Users width={14} height={14} color="#666" />
                  <Text style={styles.detailText}>
                    {shift.appliedGuards}/{shift.maxGuards} guards applied
                  </Text>
                </View>
              </View>

              {shift.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {shift.description}
                </Text>
              )}

              <View style={styles.shiftFooter}>
                <Text style={styles.clientName}>by {shift.clientName}</Text>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => handleApplyForShift(shift.id)}
                >
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No shifts available</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter !== 'all' ? 'Try adjusting your filters' : 'Check back later for new opportunities'}
            </Text>
          </View>
        )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  filterTabActive: {
    backgroundColor: '#1C6CA9',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shiftTitleContainer: {
    flex: 1,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  siteName: {
    fontSize: 14,
    color: '#666666',
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  hourlyRate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28A745',
  },
  totalPay: {
    fontSize: 12,
    color: '#666666',
  },
  shiftDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  distance: {
    fontSize: 12,
    color: '#1C6CA9',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  shiftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 12,
    color: '#999999',
  },
  applyButton: {
    backgroundColor: '#1C6CA9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default AvailableShiftsScreen;
