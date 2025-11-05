import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft, MapPin, Edit3, Plus, Users, Clock } from 'react-native-feather';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';

interface SiteDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  requirements: string;
  contactPerson: string;
  contactPhone: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

interface ShiftPosting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  status: 'Open' | 'Filled' | 'Completed';
  applicationsCount: number;
}

const SiteDetailsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const route = useRoute();
  const { siteId } = route.params as { siteId: string };
  
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteDetails | null>(null);
  const [shiftPostings, setShiftPostings] = useState<ShiftPosting[]>([]);

  useEffect(() => {
    loadSiteDetails();
  }, [siteId]);

  const loadSiteDetails = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setSite({
        id: siteId,
        name: 'Downtown Office Building',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        description: 'Modern office building requiring 24/7 security coverage',
        requirements: 'Licensed security guard with 2+ years experience',
        contactPerson: 'John Smith',
        contactPhone: '+1 (555) 123-4567',
        status: 'Active',
        createdAt: '2024-01-15'
      });

      setShiftPostings([
        {
          id: '1',
          title: 'Night Security Guard',
          startTime: '2024-11-03T18:00:00Z',
          endTime: '2024-11-04T06:00:00Z',
          hourlyRate: 25.00,
          status: 'Open',
          applicationsCount: 3
        },
        {
          id: '2',
          title: 'Weekend Security Coverage',
          startTime: '2024-11-04T08:00:00Z',
          endTime: '2024-11-04T20:00:00Z',
          hourlyRate: 22.00,
          status: 'Filled',
          applicationsCount: 5
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load site details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSite = () => {
    // TODO: Navigate to edit site screen
    console.log('Edit site:', siteId);
  };

  const handleCreateShift = () => {
    // TODO: Navigate to create shift screen
    navigation.navigate('CreateShift', { siteId });
  };

  const handleShiftPress = (shiftId: string) => {
    // TODO: Navigate to shift details screen
    console.log('View shift:', shiftId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#28A745';
      case 'Filled': return '#1C6CA9';
      case 'Completed': return '#6C757D';
      default: return '#6C757D';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <Text>Loading site details...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!site) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <Text>Site not found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

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
        <Text style={styles.headerTitle}>Site Details</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditSite}
        >
          <Edit3 width={20} height={20} color="#1C6CA9" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Site Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{site.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: site.status === 'Active' ? '#28A745' : '#DC3545' }]}>
              <Text style={styles.statusText}>{site.status}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <MapPin width={16} height={16} color="#666" />
            <Text style={styles.infoText}>
              {site.address}, {site.city}, {site.state} {site.zipCode}
            </Text>
          </View>

          {site.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description}>{site.description}</Text>
            </View>
          )}

          {site.requirements && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.label}>Security Requirements</Text>
              <Text style={styles.description}>{site.requirements}</Text>
            </View>
          )}

          <View style={styles.contactContainer}>
            <Text style={styles.label}>Contact Information</Text>
            <Text style={styles.contactText}>{site.contactPerson}</Text>
            {site.contactPhone && (
              <Text style={styles.contactText}>{site.contactPhone}</Text>
            )}
          </View>
        </View>

        {/* Shift Postings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shift Postings</Text>
            <TouchableOpacity 
              style={styles.createShiftButton}
              onPress={handleCreateShift}
            >
              <Plus width={16} height={16} color="#FFFFFF" />
              <Text style={styles.createShiftText}>Create Shift</Text>
            </TouchableOpacity>
          </View>

          {shiftPostings.length > 0 ? (
            shiftPostings.map((shift) => (
              <TouchableOpacity 
                key={shift.id}
                style={styles.shiftCard}
                onPress={() => handleShiftPress(shift.id)}
              >
                <View style={styles.shiftHeader}>
                  <Text style={styles.shiftTitle}>{shift.title}</Text>
                  <View style={[styles.shiftStatus, { backgroundColor: getStatusColor(shift.status) }]}>
                    <Text style={styles.shiftStatusText}>{shift.status}</Text>
                  </View>
                </View>
                
                <View style={styles.shiftDetails}>
                  <View style={styles.shiftDetailRow}>
                    <Clock width={14} height={14} color="#666" />
                    <Text style={styles.shiftDetailText}>
                      {formatDateTime(shift.startTime)} - {formatDateTime(shift.endTime)}
                    </Text>
                  </View>
                  
                  <View style={styles.shiftDetailRow}>
                    <Text style={styles.hourlyRate}>${shift.hourlyRate}/hour</Text>
                  </View>
                  
                  <View style={styles.shiftDetailRow}>
                    <Users width={14} height={14} color="#666" />
                    <Text style={styles.shiftDetailText}>
                      {shift.applicationsCount} applications
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No shift postings yet</Text>
              <Text style={styles.emptyStateSubtext}>Create your first shift posting to get started</Text>
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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginLeft: -15,
  },
  statusContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  contactContainer: {
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  createShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C6CA9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createShiftText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  shiftCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  shiftStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shiftStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  shiftDetails: {
    gap: 8,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  hourlyRate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28A745',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
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

export default SiteDetailsScreen;
