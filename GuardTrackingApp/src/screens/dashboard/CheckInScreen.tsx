import React, { useState, useEffect } from 'react';
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
import { Clock, MapPin, Calendar, User } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';

interface Assignment {
  id: string;
  shiftTitle: string;
  siteName: string;
  address: string;
  startTime: string;
  endTime: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
}

const CheckInScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<GuardStackParamList>>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayAssignments();
  }, []);

  const loadTodayAssignments = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      // Mock data for today's assignments
      setAssignments([
        {
          id: '1',
          shiftTitle: 'Night Security Guard',
          siteName: 'Downtown Office Building',
          address: '123 Main Street, New York, NY',
          startTime: '2024-11-03T18:00:00Z',
          endTime: '2024-11-04T06:00:00Z',
          status: 'ASSIGNED'
        },
        {
          id: '2',
          shiftTitle: 'Weekend Security Coverage',
          siteName: 'Shopping Mall',
          address: '456 Commerce Ave, New York, NY',
          startTime: '2024-11-04T08:00:00Z',
          endTime: '2024-11-04T20:00:00Z',
          status: 'IN_PROGRESS'
        }
      ]);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentPress = (assignmentId: string) => {
    navigation.navigate('CheckInOut', { assignmentId });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return '#FFA500';
      case 'IN_PROGRESS': return '#28A745';
      case 'COMPLETED': return '#6C757D';
      default: return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'Ready to Check In';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  };

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check In / Check Out</Text>
        <Clock width={24} height={24} color="#1C6CA9" />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Time */}
        <View style={styles.timeCard}>
          <Text style={styles.timeLabel}>Current Time</Text>
          <Text style={styles.currentTime}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
          <Text style={styles.currentDate}>
            {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Today's Assignments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Assignments</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading assignments...</Text>
            </View>
          ) : assignments.length > 0 ? (
            assignments.map((assignment) => (
              <TouchableOpacity 
                key={assignment.id}
                style={styles.assignmentCard}
                onPress={() => handleAssignmentPress(assignment.id)}
              >
                <View style={styles.assignmentHeader}>
                  <Text style={styles.assignmentTitle}>{assignment.shiftTitle}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(assignment.status)}</Text>
                  </View>
                </View>
                
                <Text style={styles.siteName}>{assignment.siteName}</Text>
                
                <View style={styles.assignmentDetails}>
                  <View style={styles.detailRow}>
                    <MapPin width={14} height={14} color="#666" />
                    <Text style={styles.detailText}>{assignment.address}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Calendar width={14} height={14} color="#666" />
                    <Text style={styles.detailText}>
                      {formatTime(assignment.startTime)} - {formatTime(assignment.endTime)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.actionContainer}>
                  <Text style={styles.actionText}>
                    {assignment.status === 'ASSIGNED' ? 'Tap to Check In' : 
                     assignment.status === 'IN_PROGRESS' ? 'Tap to Check Out' : 
                     'View Details'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <User width={48} height={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No assignments for today</Text>
              <Text style={styles.emptyStateSubtext}>Check the Jobs tab for available shifts</Text>
            </View>
          )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  timeCard: {
    backgroundColor: '#1C6CA9',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  timeLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  currentTime: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentDate: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  assignmentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  siteName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  assignmentDetails: {
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
  },
  actionContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionText: {
    fontSize: 14,
    color: '#1C6CA9',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default CheckInScreen;
