// Guard Site Details Screen - Updated UI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { LocationIcon, ClockIcon, CheckCircleIcon } from '../../components/ui/AppIcons';
import { MapPinIcon, CalendarIcon } from '../../components/ui/FeatherIcons';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import GuardProfileDrawer from '../../components/guard/GuardProfileDrawer';
import apiService from '../../services/api';

interface SiteDetails {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description: string;
  requirements: string;
  latitude?: number;
  longitude?: number;
  status: 'Active' | 'Inactive';
}

interface ShiftPosting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  status: 'OPEN' | 'FILLED' | 'COMPLETED';
  applicationsCount?: number;
}

import { GuardStackParamList } from '../../navigation/GuardStackNavigator';

type GuardSiteDetailsScreenNavigationProp = StackNavigationProp<GuardStackParamList, 'GuardSiteDetails'>;

const GuardSiteDetailsScreen: React.FC = () => {
  const navigation = useNavigation<GuardSiteDetailsScreenNavigationProp>();
  const route = useRoute();
  const { siteId } = (route.params as { siteId: string }) || {};
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteDetails | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (siteId) {
      loadSiteDetails();
    }
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
      
      // Load site details from API
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
          latitude: siteData.latitude || undefined,
          longitude: siteData.longitude || undefined,
          status: siteData.isActive ? 'Active' : 'Inactive'
        });

        // Load shifts for this site
        try {
          // Get shifts assigned to the current guard for this site
          const shiftsResult = await apiService.getUpcomingShifts();
          if (shiftsResult.success && shiftsResult.data) {
            const allShifts = Array.isArray(shiftsResult.data) ? shiftsResult.data : [];
            const siteShifts = allShifts.filter((shift: any) => shift.siteId === siteId);
            setShifts(siteShifts.map((shift: any) => ({
              id: shift.id,
              scheduledStartTime: shift.scheduledStartTime,
              scheduledEndTime: shift.scheduledEndTime,
              status: shift.status,
              guard: shift.guard
            })));
          } else {
            setShifts([]);
          }
        } catch (shiftError) {
          // Non-critical - shifts will just be empty
          console.warn('Failed to load shifts:', shiftError);
          setShifts([]);
        }
      } else {
        const errorMessage = siteResult.message || 'Failed to load site details';
        Alert.alert('Error', errorMessage, [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
            style: 'default'
          }
        ]);
      }
    } catch (error: any) {
      console.error('Error loading site details:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to load site details. Please try again.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
            style: 'default'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShiftPress = (shiftId: string) => {
    // Navigate to shift details screen (Option B - no applications)
    (navigation as any).navigate('ShiftDetails', { shiftId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return COLORS.primary;
      case 'IN_PROGRESS': return COLORS.success;
      case 'COMPLETED': return COLORS.textSecondary;
      case 'CANCELLED': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader
          variant="guard"
          title="Site Details"
          showLogo={false}
          profileDrawer={
            <GuardProfileDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onNavigateToProfile={() => {
                closeDrawer();
                navigation.navigate('GuardTabs', { 
                  screen: 'Settings',
                  params: { screen: 'GuardProfileEdit' }
                });
              }}
              onNavigateToNotifications={() => {
                closeDrawer();
                navigation.navigate('GuardTabs', { 
                  screen: 'Settings',
                  params: { screen: 'GuardNotificationSettings' }
                });
              }}
              onNavigateToSupport={() => {
                closeDrawer();
                navigation.navigate('GuardTabs', { screen: 'Chat' });
              }}
            />
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading site details...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!site) {
    return (
      <SafeAreaWrapper>
        <SharedHeader
          variant="guard"
          title="Site Details"
          showLogo={false}
          profileDrawer={
            <GuardProfileDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onNavigateToProfile={() => {
                closeDrawer();
                navigation.navigate('GuardTabs', { 
                  screen: 'Settings',
                  params: { screen: 'GuardProfileEdit' }
                });
              }}
              onNavigateToNotifications={() => {
                closeDrawer();
                navigation.navigate('GuardTabs', { 
                  screen: 'Settings',
                  params: { screen: 'GuardNotificationSettings' }
                });
              }}
              onNavigateToSupport={() => {
                closeDrawer();
                navigation.navigate('GuardTabs', { screen: 'Chat' });
              }}
            />
          }
        />
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Site not found</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="guard"
        title="Site Details"
        showLogo={false}
        profileDrawer={
          <GuardProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToProfile={() => {
              closeDrawer();
              navigation.navigate('GuardTabs', { 
                screen: 'Settings',
                params: { screen: 'GuardProfileEdit' }
              });
            }}
            onNavigateToNotifications={() => {
              closeDrawer();
              navigation.navigate('GuardTabs', { 
                screen: 'Settings',
                params: { screen: 'GuardNotificationSettings' }
              });
            }}
            onNavigateToSupport={() => {
              closeDrawer();
              navigation.navigate('GuardTabs', { screen: 'Chat' });
            }}
          />
        }
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Site Information Card */}
        <View style={styles.section}>
          <View style={styles.siteHeader}>
            <Text style={styles.siteName}>{site.name}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: site.status === 'Active' ? COLORS.success + '20' : COLORS.error + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: site.status === 'Active' ? COLORS.success : COLORS.error }
              ]}>
                {site.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <View style={styles.iconContainer}>
              <LocationIcon size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.addressText}>
              {site.address}
              {site.city && `, ${site.city}`}
              {site.state && `, ${site.state}`}
              {site.zipCode && ` ${site.zipCode}`}
            </Text>
          </View>

          {site.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description}>{site.description}</Text>
            </View>
          )}

          {site.requirements && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.label}>Security Requirements</Text>
              <Text style={styles.requirements}>{site.requirements}</Text>
            </View>
          )}
        </View>

        {/* Available Shifts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Shifts</Text>
            <Text style={styles.shiftCount}>{shiftPostings.length} shifts</Text>
          </View>

          {shifts.length > 0 ? (
            shifts.map((shift) => (
              <TouchableOpacity 
                key={shift.id}
                style={styles.shiftCard}
                onPress={() => handleShiftPress(shift.id)}
                activeOpacity={0.7}
              >
                <View style={styles.shiftHeader}>
                  <Text style={styles.shiftTitle}>
                    {shift.guard ? `${shift.guard.user.firstName} ${shift.guard.user.lastName}` : 'Unassigned Shift'}
                  </Text>
                  <View style={[
                    styles.shiftStatusBadge,
                    { backgroundColor: getStatusColor(shift.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.shiftStatusText,
                      { color: getStatusColor(shift.status) }
                    ]}>
                      {shift.status}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.shiftDetails}>
                  <View style={styles.shiftDetailRow}>
                    <CalendarIcon size={16} color={COLORS.textSecondary} />
                    <Text style={styles.shiftDetailText}>
                      {formatDateTime(shift.scheduledStartTime)} - {formatDateTime(shift.scheduledEndTime)}
                    </Text>
                  </View>
                  
                  <View style={styles.shiftDetailRow}>
                    <ClockIcon size={16} color={COLORS.textSecondary} />
                    <Text style={styles.shiftDetailText}>
                      {Math.round((new Date(shift.scheduledEndTime).getTime() - new Date(shift.scheduledStartTime).getTime()) / (1000 * 60 * 60))} hours
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No shifts scheduled</Text>
              <Text style={styles.emptyStateSubtext}>
                Shifts are assigned directly by admin. Check back later for new assignments.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  section: {
    backgroundColor: COLORS.backgroundPrimary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
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
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  addressText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  descriptionContainer: {
    marginBottom: SPACING.lg,
  },
  requirementsContainer: {
    marginTop: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  requirements: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  shiftCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  shiftCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  shiftStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  shiftDetails: {
    gap: SPACING.xs,
  },
  shiftDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftDetailText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  hourlyRateLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  hourlyRate: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.success,
  },
  applicationsRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  applicationsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
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

export default GuardSiteDetailsScreen;

