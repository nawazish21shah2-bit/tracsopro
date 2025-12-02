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
import { ArrowLeft, MapPin, Users, Clock } from 'react-native-feather';
import apiService from '../../services/api';
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
      // Load site details
      const siteResult = await apiService.getSiteById(siteId);
      
      if (siteResult.success && siteResult.data) {
        const siteData = siteResult.data;
        setSite({
          id: siteId,
          name: siteData.name || 'Site',
          address: siteData.address || '',
          city: siteData.city || '',
          state: siteData.state || '',
          zipCode: siteData.zipCode || '',
          description: siteData.description || '',
          requirements: siteData.requirements || '',
          contactPerson: siteData.contactPerson || siteData.client?.user?.firstName + ' ' + siteData.client?.user?.lastName || '',
          contactPhone: siteData.contactPhone || '',
          status: siteData.isActive ? 'Active' : 'Inactive',
          createdAt: siteData.createdAt || new Date().toISOString()
        });

        // Load shift postings for this site
        // Note: This would ideally be a separate endpoint like /sites/:id/shift-postings
        // For now, we'll use client sites endpoint and filter
        const sitesResult = await apiService.getClientSites(1, 100);
        if (sitesResult.success && sitesResult.data?.sites) {
          const foundSite = sitesResult.data.sites.find((s: any) => s.id === siteId);
          if (foundSite && foundSite.shiftPostings) {
            setShiftPostings(foundSite.shiftPostings.map((sp: any) => ({
              id: sp.id,
              title: sp.title,
              startTime: sp.startTime,
              endTime: sp.endTime,
              hourlyRate: sp.hourlyRate || 0,
              status: sp.status === 'OPEN' ? 'Open' : sp.status === 'FILLED' ? 'Filled' : 'Completed',
              applicationsCount: sp.applications?.length || 0
            })));
          }
        }
      } else {
        Alert.alert('Error', siteResult.message || 'Failed to load site details');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load site details');
    } finally {
      setLoading(false);
    }
  };

  // Clients can view site and related shifts but not edit site or create shifts directly.

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
        {/* Clients cannot edit the site */}
        <View style={styles.editButton} />
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

        {/* Shift Postings (view-only for client) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shift Postings</Text>
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
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No shift postings yet</Text>
              <Text style={styles.emptyStateSubtext}>Contact your security provider to schedule shifts for this site.</Text>
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
