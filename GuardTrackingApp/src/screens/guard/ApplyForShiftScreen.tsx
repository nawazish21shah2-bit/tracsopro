import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Send, MapPin, Clock, DollarSign, User } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';

interface ShiftDetails {
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
}

const ApplyForShiftScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { shiftId } = route.params as { shiftId: string };
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shift, setShift] = useState<ShiftDetails | null>(null);
  const [applicationMessage, setApplicationMessage] = useState('');

  useEffect(() => {
    loadShiftDetails();
  }, [shiftId]);

  const loadShiftDetails = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setShift({
        id: shiftId,
        title: 'Night Security Guard',
        siteName: 'Downtown Office Building',
        address: '123 Main Street, New York, NY 10001',
        startTime: '2024-11-03T18:00:00Z',
        endTime: '2024-11-04T06:00:00Z',
        hourlyRate: 25.00,
        maxGuards: 1,
        appliedGuards: 0,
        requirements: 'Licensed security guard with 2+ years experience. Must be available for overnight shifts.',
        description: 'Overnight security coverage for office building. Responsibilities include monitoring entrances, conducting regular patrols, and maintaining security logs.',
        clientName: 'ABC Property Management'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load shift details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!applicationMessage.trim()) {
      Alert.alert('Error', 'Please provide a message with your application');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Integrate with backend API
      console.log('Submitting application for shift:', shiftId, applicationMessage);
      
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Application Submitted',
        'Your application has been sent to the client. You will be notified when they review your application.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hours;
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <Text>Loading shift details...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!shift) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <Text>Shift not found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const duration = calculateDuration(shift.startTime, shift.endTime);
  const totalPay = shift.hourlyRate * duration;

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
        <Text style={styles.headerTitle}>Apply for Shift</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shift Details */}
        <View style={styles.section}>
          <Text style={styles.shiftTitle}>{shift.title}</Text>
          <Text style={styles.siteName}>{shift.siteName}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <MapPin width={16} height={16} color="#666" />
              <Text style={styles.detailText}>{shift.address}</Text>
            </View>

            <View style={styles.detailRow}>
              <Clock width={16} height={16} color="#666" />
              <Text style={styles.detailText}>
                {formatDateTime(shift.startTime)} - {formatDateTime(shift.endTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <DollarSign width={16} height={16} color="#666" />
              <Text style={styles.detailText}>
                ${shift.hourlyRate}/hour • ${totalPay.toFixed(0)} total ({duration}h)
              </Text>
            </View>

            <View style={styles.detailRow}>
              <User width={16} height={16} color="#666" />
              <Text style={styles.detailText}>
                {shift.appliedGuards}/{shift.maxGuards} guards applied
              </Text>
            </View>
          </View>

          <View style={styles.clientContainer}>
            <Text style={styles.clientLabel}>Posted by</Text>
            <Text style={styles.clientName}>{shift.clientName}</Text>
          </View>
        </View>

        {/* Description */}
        {shift.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.description}>{shift.description}</Text>
          </View>
        )}

        {/* Requirements */}
        {shift.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.requirements}>{shift.requirements}</Text>
          </View>
        )}

        {/* Application Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Message</Text>
          <Text style={styles.messageHint}>
            Tell the client why you're the right fit for this shift
          </Text>
          <TextInput
            style={styles.messageInput}
            value={applicationMessage}
            onChangeText={setApplicationMessage}
            placeholder="I am interested in this position because..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmitApplication}
          disabled={submitting}
        >
          <Send width={16} height={16} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting Application...' : 'Submit Application'}
          </Text>
        </TouchableOpacity>
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
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  shiftTitle: {
    fontSize: 20,
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
    flex: 1,
  },
  clientContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  clientLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  requirements: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  messageHint: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    height: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C6CA9',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ApplyForShiftScreen;
