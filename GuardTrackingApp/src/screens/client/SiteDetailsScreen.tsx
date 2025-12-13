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
import { LocationIcon, ClockIcon, ArrowLeftIcon } from '../../components/ui/AppIcons';
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

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

interface Shift {
  id: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  guard?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

const SiteDetailsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const route = useRoute();
  const { siteId } = route.params as { siteId: string };
  
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteDetails | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    loadSiteDetails();
  }, [siteId]);

  const loadSiteDetails = async () => {
    try {
      setLoading(true);
      
      // Validate siteId exists
      if (!siteId || typeof siteId !== 'string' || siteId.trim() === '') {
        Alert.alert(
          'Error',
          'Invalid site ID. Please go back and try selecting the site again.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'default'
            }
          ]
        );
        setLoading(false);
        return;
      }
      
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
          contactPerson: siteData.contactPerson || 
            (siteData.client?.user 
              ? `${siteData.client.user.firstName || ''} ${siteData.client.user.lastName || ''}`.trim() 
              : '') || '',
          contactPhone: siteData.contactPhone || '',
          status: siteData.isActive ? 'Active' : 'Inactive',
          createdAt: siteData.createdAt || new Date().toISOString()
        });

        // Load shifts for this site (Option B - Direct Assignment)
        try {
          const sitesResult = await apiService.getClientSites(1, 100);
          if (sitesResult.success && sitesResult.data?.sites) {
            const foundSite = sitesResult.data.sites.find((s: any) => s.id === siteId);
            if (foundSite && foundSite.shifts) {
              setShifts(foundSite.shifts.map((shift: any) => ({
                id: shift.id,
                scheduledStartTime: shift.scheduledStartTime,
                scheduledEndTime: shift.scheduledEndTime,
                status: shift.status,
                guard: shift.guard
              })));
            }
          }
        } catch (shiftError) {
          // Non-critical - shifts will just be empty
          console.warn('Failed to load shifts:', shiftError);
        }
      } else {
        const errorMessage = siteResult.message || 'Failed to fetch site details';
        Alert.alert(
          'Site Not Found',
          errorMessage === 'Site not found' 
            ? 'The requested site could not be found. It may have been deleted or you may not have access to it.'
            : errorMessage,
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'default'
            }
          ]
        );
        console.error('Site fetch error:', siteResult);
      }
    } catch (error: any) {
      console.error('Load site details error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to load site details. Please check your connection and try again.';
      Alert.alert(
        'Error',
        errorMessage,
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
            style: 'default'
          },
          {
            text: 'Retry',
            onPress: () => loadSiteDetails(),
            style: 'default'
          }
        ]
      );
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
      case 'SCHEDULED': return COLORS.primary; // Blue for scheduled
      case 'IN_PROGRESS': return COLORS.success;
      case 'COMPLETED': return COLORS.textSecondary;
      case 'CANCELLED': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
    const formattedTime = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `${formattedDate} ${formattedTime}`;
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
          <ArrowLeftIcon size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Details</Text>
        <View style={styles.editButton} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Site Information Card */}
        <View style={styles.section}>
          <View style={styles.siteHeader}>
            <Text style={styles.siteName}>{site.name}</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: site.status === 'Active' ? COLORS.success : COLORS.error 
            }]}>
              <Text style={styles.statusText}>{site.status}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <LocationIcon size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {site.address}, {site.city}, {site.state} {site.zipCode}
            </Text>
          </View>

          <View style={styles.contactContainer}>
            <Text style={styles.contactLabel}>Contact Information</Text>
            <Text style={styles.contactText}>{site.contactPerson || 'N/A'}</Text>
            {site.contactPhone && (
              <Text style={styles.contactText}>{site.contactPhone}</Text>
            )}
          </View>
        </View>

        {/* Shifts Card */}
        <View style={styles.section}>
          <Text style={styles.shiftsSectionTitle}>Shifts</Text>

          {shifts.length > 0 ? (
            shifts.map((shift) => (
              <View key={shift.id} style={styles.shiftCard}>
                <View style={styles.shiftHeader}>
                  <Text style={styles.shiftTitle}>
                    {shift.guard 
                      ? `${shift.guard.user.firstName} ${shift.guard.user.lastName}` 
                      : 'Unassigned'}
                  </Text>
                  <View style={[styles.shiftStatusBadge, { 
                    backgroundColor: getStatusColor(shift.status) 
                  }]}>
                    <Text style={styles.shiftStatusText}>{shift.status}</Text>
                  </View>
                </View>
                
                <View style={styles.shiftDetailRow}>
                  <ClockIcon size={14} color={COLORS.textSecondary} />
                  <Text style={styles.shiftDetailText}>
                    {formatDateTime(shift.scheduledStartTime)} - {formatDateTime(shift.scheduledEndTime)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No shifts scheduled yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Contact your security provider to schedule shifts for this site.
              </Text>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
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
    backgroundColor: COLORS.backgroundPrimary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  siteName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  shiftsSectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  statusText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contactContainer: {
    marginTop: SPACING.md,
  },
  contactLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  contactText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  createShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.small,
  },
  createShiftText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.xs,
  },
  shiftCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  shiftTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  shiftStatusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  shiftStatusText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  shiftDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  shiftDetailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  hourlyRate: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});

export default SiteDetailsScreen;
