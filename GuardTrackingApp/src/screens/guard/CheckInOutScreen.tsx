import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Camera } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

const { width } = Dimensions.get('window');

interface Assignment {
  id: string;
  shiftTitle: string;
  siteName: string;
  address: string;
  startTime: string;
  endTime: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

const CheckInOutScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { assignmentId } = route.params as { assignmentId: string };
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadAssignment();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setAssignment({
        id: assignmentId,
        shiftTitle: 'Night Security Guard',
        siteName: 'Downtown Office Building',
        address: '123 Main Street, New York, NY 10001',
        startTime: '2024-11-03T18:00:00Z',
        endTime: '2024-11-04T06:00:00Z',
        status: 'ASSIGNED', // This would be dynamic based on actual status
        checkInTime: undefined,
        checkOutTime: undefined,
        notes: ''
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!assignment) return;

    setProcessing(true);
    try {
      // TODO: Get current location and integrate with backend API
      console.log('Checking in for assignment:', assignmentId, notes);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      
      // Update local state
      setAssignment(prev => prev ? {
        ...prev,
        status: 'IN_PROGRESS',
        checkInTime: new Date().toISOString(),
        notes: notes
      } : null);

      Alert.alert('Success', 'You have successfully checked in to your shift!');
      setNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!assignment) return;

    setProcessing(true);
    try {
      // TODO: Get current location and integrate with backend API
      console.log('Checking out from assignment:', assignmentId, notes);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      
      // Update local state
      setAssignment(prev => prev ? {
        ...prev,
        status: 'COMPLETED',
        checkOutTime: new Date().toISOString(),
        notes: prev.notes ? `${prev.notes}\n\nCheck-out: ${notes}` : notes
      } : null);

      Alert.alert(
        'Shift Completed',
        'You have successfully checked out. Thank you for your service!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to check out. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isWithinShiftTime = () => {
    if (!assignment) return false;
    const now = new Date();
    const shiftStart = new Date(assignment.startTime);
    const shiftEnd = new Date(assignment.endTime);
    const thirtyMinutesEarly = new Date(shiftStart.getTime() - 30 * 60 * 1000);
    
    return now >= thirtyMinutesEarly && now <= shiftEnd;
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <Text>Loading assignment...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!assignment) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <Text>Assignment not found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const canCheckIn = assignment.status === 'ASSIGNED' && isWithinShiftTime();
  const canCheckOut = assignment.status === 'IN_PROGRESS';
  const isCompleted = assignment.status === 'COMPLETED';

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft width={24} height={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCompleted ? 'Shift Completed' : canCheckOut ? 'Check Out' : 'Check In'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Current Time */}
        <View style={styles.timeContainer}>
          <Text style={styles.currentTimeLabel}>Current Time</Text>
          <Text style={styles.currentTime}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
          <Text style={styles.currentDate}>
            {currentTime.toLocaleDateString()}
          </Text>
        </View>

        {/* Assignment Details */}
        <View style={styles.section}>
          <Text style={styles.shiftTitle}>{assignment.shiftTitle}</Text>
          <Text style={styles.siteName}>{assignment.siteName}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MapPin width={16} height={16} color="#666" />
              <Text style={styles.detailText}>{assignment.address}</Text>
            </View>

            <View style={styles.detailRow}>
              <Clock width={16} height={16} color="#666" />
              <Text style={styles.detailText}>
                {formatTime(assignment.startTime)} - {formatTime(assignment.endTime)}
              </Text>
            </View>
          </View>

          {/* Status Information */}
          <View style={styles.statusContainer}>
            {assignment.checkInTime && (
              <View style={styles.statusRow}>
                <CheckCircle width={16} height={16} color="#28A745" />
                <Text style={styles.statusText}>
                  Checked in: {formatDateTime(assignment.checkInTime)}
                </Text>
              </View>
            )}
            
            {assignment.checkOutTime && (
              <View style={styles.statusRow}>
                <XCircle width={16} height={16} color="#DC3545" />
                <Text style={styles.statusText}>
                  Checked out: {formatDateTime(assignment.checkOutTime)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes Section */}
        {!isCompleted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {canCheckOut ? 'Check-out Notes' : 'Check-in Notes'}
            </Text>
            <Text style={styles.notesHint}>
              {canCheckOut 
                ? 'Add any final notes about your shift completion'
                : 'Add any notes about your arrival or observations'
              }
            </Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={canCheckOut ? "Shift completed successfully..." : "Arrived on time, all secure..."}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Previous Notes */}
        {assignment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shift Notes</Text>
            <Text style={styles.previousNotes}>{assignment.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {!isCompleted && (
          <View style={styles.actionContainer}>
            {canCheckIn && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.checkInButton, processing && styles.actionButtonDisabled]}
                onPress={handleCheckIn}
                disabled={processing}
              >
                <CheckCircle width={20} height={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {processing ? 'Checking In...' : 'Check In'}
                </Text>
              </TouchableOpacity>
            )}

            {canCheckOut && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.checkOutButton, processing && styles.actionButtonDisabled]}
                onPress={handleCheckOut}
                disabled={processing}
              >
                <XCircle width={20} height={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {processing ? 'Checking Out...' : 'Check Out'}
                </Text>
              </TouchableOpacity>
            )}

            {!canCheckIn && !canCheckOut && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  {assignment.status === 'ASSIGNED' 
                    ? 'You can check in 30 minutes before your shift starts'
                    : 'Please check in first to access check-out'
                  }
                </Text>
              </View>
            )}
          </View>
        )}

        {isCompleted && (
          <View style={styles.completedContainer}>
            <CheckCircle width={48} height={48} color="#28A745" />
            <Text style={styles.completedText}>Shift Completed Successfully</Text>
            <Text style={styles.completedSubtext}>Thank you for your service!</Text>
          </View>
        )}
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeContainer: {
    backgroundColor: '#1C6CA9',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  currentTimeLabel: {
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
  shiftTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  siteName: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666666',
  },
  statusContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  notesHint: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    height: 100,
  },
  previousNotes: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  checkInButton: {
    backgroundColor: '#28A745',
  },
  checkOutButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  infoText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28A745',
    marginTop: 16,
    marginBottom: 4,
  },
  completedSubtext: {
    fontSize: 14,
    color: '#666666',
  },
});

export default CheckInOutScreen;
