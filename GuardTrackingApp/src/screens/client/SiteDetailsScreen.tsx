import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import SiteShiftCard, { SiteShiftItem } from '../../components/client/SiteShiftCard';
import { ClientStackParamList } from '../../navigation/ClientStackNavigator';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { MapPinIcon } from '../../components/ui/FeatherIcons';
import { InlineLoading, EmptyState } from '../../components/ui/LoadingStates';

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
  radiusMeters?: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

const SiteDetailsScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<ClientStackParamList>>();
  const route = useRoute();
  const { siteId } = route.params as { siteId: string };

  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<SiteDetails | null>(null);
  const [shifts, setShifts] = useState<SiteShiftItem[]>([]);

  const loadSiteDetails = useCallback(async () => {
    try {
      setLoading(true);

      if (!siteId?.trim()) {
        Alert.alert('Error', 'Invalid site ID.', [
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      const [siteResult, shiftsResult] = await Promise.all([
        apiService.getSiteById(siteId),
        apiService.getClientShifts({ siteId, limit: 50, page: 1 }),
      ]);

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
          contactPerson:
            siteData.contactPerson ||
            (siteData.client?.user
              ? `${siteData.client.user.firstName || ''} ${siteData.client.user.lastName || ''}`.trim()
              : '') ||
            '',
          contactPhone: siteData.contactPhone || '',
          radiusMeters: siteData.radiusMeters ?? 100,
          status: siteData.isActive ? 'Active' : 'Inactive',
          createdAt: siteData.createdAt || new Date().toISOString(),
        });
      } else {
        Alert.alert('Site Not Found', siteResult.message || 'Could not load site.', [
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      if (shiftsResult.success && shiftsResult.data?.shifts) {
        setShifts(
          shiftsResult.data.shifts.map((shift: any) => ({
            id: shift.id,
            scheduledStartTime: shift.scheduledStartTime || shift.startTime,
            scheduledEndTime: shift.scheduledEndTime || shift.endTime,
            status: shift.status,
            description: shift.description,
            notes: shift.notes,
            guard: shift.guard,
          })),
        );
      } else {
        setShifts([]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load site details.', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
        { text: 'Retry', onPress: () => loadSiteDetails() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [siteId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadSiteDetails();
    }, [loadSiteDetails]),
  );

  const handleShiftPress = (shiftId: string) => {
    navigation.navigate('ShiftDetails', { shiftId });
  };

  const handleEditShift = (shift: SiteShiftItem) => {
    if (shift.status !== 'SCHEDULED') {
      Alert.alert('Cannot edit', 'Only scheduled shifts can be edited.');
      return;
    }
    navigation.navigate('EditShift', { shiftId: shift.id, shift });
  };

  const handleDeleteShift = (shift: SiteShiftItem) => {
    if (shift.status !== 'SCHEDULED') {
      Alert.alert('Cannot cancel', 'Only scheduled shifts can be cancelled.');
      return;
    }

    Alert.alert('Cancel Shift', 'Are you sure you want to cancel this shift?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          const result = await apiService.deleteClientShift(shift.id);
          if (result.success) {
            Alert.alert('Cancelled', 'Shift was cancelled.');
            loadSiteDetails();
          } else {
            Alert.alert('Error', result.message || 'Failed to cancel shift');
          }
        },
      },
    ]);
  };

  const handleCreateShift = () => {
    navigation.navigate('CreateShift', { siteId });
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant="client" title="Site Details" showLogo={false} />
        <InlineLoading size="large" message="Loading site..." style={styles.loadingBox} />
      </SafeAreaWrapper>
    );
  }

  if (!site) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant="client" title="Site Details" showLogo={false} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Site not found</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const fullAddress = [site.address, site.city, site.state, site.zipCode].filter(Boolean).join(', ');

  return (
    <SafeAreaWrapper>
      <SharedHeader variant="client" title="Site Details" showLogo={false} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.siteCard}>
          <View style={styles.siteAccent} />
          <View style={styles.siteBody}>
            <View style={styles.siteHeader}>
              <Text style={styles.siteName}>{site.name}</Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      site.status === 'Active' ? COLORS.success + '18' : COLORS.error + '18',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: site.status === 'Active' ? COLORS.success : COLORS.error },
                  ]}
                >
                  {site.status}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MapPinIcon size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>{fullAddress || 'No address on file'}</Text>
            </View>

            <Text style={styles.radiusText}>
              Check-in radius: {site.radiusMeters ?? 100}m
            </Text>

            {(site.contactPerson || site.contactPhone) && (
              <View style={styles.contactBlock}>
                <Text style={styles.contactLabel}>Contact</Text>
                {site.contactPerson ? (
                  <Text style={styles.contactText}>{site.contactPerson}</Text>
                ) : null}
                {site.contactPhone ? (
                  <Text style={styles.contactText}>{site.contactPhone}</Text>
                ) : null}
              </View>
            )}

            {site.description ? (
              <Text style={styles.siteDescription}>{site.description}</Text>
            ) : null}
          </View>
        </View>

        <SectionHeader
          title="Site Shifts"
          subtitle={
            shifts.length > 0
              ? `${shifts.length} shift${shifts.length !== 1 ? 's' : ''} at this site`
              : 'Manage scheduled shifts'
          }
          actionLabel="+ New Shift"
          onActionPress={handleCreateShift}
        />

        {shifts.length > 0 ? (
          shifts.map((shift) => (
            <SiteShiftCard
              key={shift.id}
              shift={shift}
              onDetails={() => handleShiftPress(shift.id)}
              onEdit={() => handleEditShift(shift)}
              onCancel={() => handleDeleteShift(shift)}
            />
          ))
        ) : (
          <EmptyState
            title="No shifts yet"
            message="Schedule a shift for this site or contact your security provider."
          />
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  siteCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  siteAccent: {
    width: 4,
    backgroundColor: COLORS.primary,
  },
  siteBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  siteName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  statusPillText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  contactBlock: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    marginBottom: SPACING.sm,
  },
  contactLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  contactText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  siteDescription: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  radiusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default SiteDetailsScreen;
