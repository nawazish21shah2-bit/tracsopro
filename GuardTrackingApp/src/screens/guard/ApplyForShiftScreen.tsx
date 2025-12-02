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
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft, Send, MapPin, Clock, DollarSign, User } from 'react-native-feather';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { GuardStackParamList } from '../../navigation/GuardStackNavigator';

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
  const navigation = useNavigation<StackNavigationProp<GuardStackParamList>>();
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
      const result = await apiService.getShiftPostingById(shiftId);
      
      if (result.success && result.data) {
        const sp = result.data;
        setShift({
          id: shiftId,
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
          clientName: sp.client?.user ? `${sp.client.user.firstName} ${sp.client.user.lastName}` : sp.clientName || 'Client'
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to load shift details');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load shift details');
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
      const result = await apiService.applyForShift(shiftId, applicationMessage.trim());
      
      if (result.success) {
        Alert.alert(
          'Application Submitted',
          result.message || 'Your application has been sent to the client. You will be notified when they review your application.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to submit application. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application. Please try again.');
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
          <TouchableOpacity 
            onPress={() => {
              // Navigate to site details - using a mock siteId for now
              // TODO: Get actual siteId from shift data
              navigation.navigate('GuardSiteDetails', { siteId: '1' });
            }}
          >
            <Text style={styles.siteName}>{shift.siteName}</Text>
          </TouchableOpacity>
          
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
    color: '#1C6CA9',
    marginBottom: 16,
    textDecorationLine: 'underline',
    fontWeight: '500',
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
