import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Search, MapPin, Clock, DollarSign, Users, Filter } from 'react-native-feather';
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
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setShifts([
        {
          id: '1',
          title: 'Night Security Guard',
          siteName: 'Downtown Office Building',
          address: '123 Main Street, New York, NY',
          startTime: '2024-11-03T18:00:00Z',
          endTime: '2024-11-04T06:00:00Z',
          hourlyRate: 25.00,
          maxGuards: 1,
          appliedGuards: 0,
          requirements: 'Licensed security guard with 2+ years experience',
          description: 'Overnight security coverage for office building',
          clientName: 'ABC Property Management',
          distance: 2.3,
          postedAt: '2024-11-01T10:00:00Z'
        },
        {
          id: '2',
          title: 'Weekend Security Coverage',
          siteName: 'Shopping Mall',
          address: '456 Commerce Ave, New York, NY',
          startTime: '2024-11-04T08:00:00Z',
          endTime: '2024-11-04T20:00:00Z',
          hourlyRate: 22.00,
          maxGuards: 2,
          appliedGuards: 1,
          requirements: 'Valid security license required',
          description: 'Weekend security patrol for shopping center',
          clientName: 'Mall Security Inc',
          distance: 5.7,
          postedAt: '2024-11-01T14:30:00Z'
        },
        {
          id: '3',
          title: 'Event Security',
          siteName: 'Convention Center',
          address: '789 Event Plaza, New York, NY',
          startTime: '2024-11-05T16:00:00Z',
          endTime: '2024-11-06T02:00:00Z',
          hourlyRate: 30.00,
          maxGuards: 3,
          appliedGuards: 2,
          requirements: 'Event security experience preferred',
          description: 'Security for corporate event and conference',
          clientName: 'Event Solutions LLC',
          distance: 8.1,
          postedAt: '2024-11-02T09:15:00Z'
        }
      ]);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAvailableShifts();
  };

  const handleShiftPress = (shiftId: string) => {
    navigation.navigate('ShiftDetails', { shiftId });
  };

  const handleApplyForShift = (shiftId: string) => {
    navigation.navigate('ApplyForShift', { shiftId });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hours;
  };

  const getFilteredShifts = () => {
    switch (filter) {
      case 'nearby':
        return shifts.filter(shift => shift.distance <= 5);
      case 'high-pay':
        return shifts.filter(shift => shift.hourlyRate >= 25);
      default:
        return shifts;
    }
  };

  const filteredShifts = getFilteredShifts();

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
            <Text>Loading available shifts...</Text>
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
