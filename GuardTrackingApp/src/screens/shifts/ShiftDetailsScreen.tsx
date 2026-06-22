/**
 * Unified Shift Details — all roles (Guard, Admin, Client)
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { shiftApi } from '../../services/api/shiftApi';
import { clientApi } from '../../services/api/clientApi';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import SectionHeader from '../../components/ui/SectionHeader';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { MapPinIcon, ClockIcon, EditIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import { ErrorHandler } from '../../utils/errorHandler';
import InteractiveMapView from '../../components/client/InteractiveMapView';
import { useLiveGuardLocations } from '../../hooks/useLiveGuardLocations';
import locationTrackingService from '../../services/locationTrackingService';
import WebSocketService from '../../services/WebSocketService';
import {
  getShiftStatusColor,
  getShiftStatusLabel,
  formatShiftTimeRange,
} from '../../utils/shiftStatusUtils';
import { pickProfilePictureUrl } from '../../utils/profilePictureUtils';

export type ShiftDetailsParams = {
  shiftId: string;
};

interface ShiftRecord {
  id: string;
  status: string;
  locationName?: string;
  locationAddress?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  notes?: string;
  checkInTime?: string;
  checkOutTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  guard?: {
    id: string;
    profilePictureUrl?: string | null;
    user?: {
      firstName: string;
      lastName: string;
      profilePictureUrl?: string | null;
    };
  };
  site?: { id: string; name: string; address: string };
  client?: { id: string; user?: { firstName: string; lastName: string } };
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value, subValue }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIconWrap}>{icon}</View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      {subValue ? <Text style={styles.detailSubValue}>{subValue}</Text> : null}
    </View>
  </View>
);

const ShiftDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { shiftId } = route.params as ShiftDetailsParams;
  const { user } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || 'GUARD').toUpperCase();

  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<ShiftRecord | null>(null);

  const supplementalLiveGuards = useMemo(
    () =>
      shift?.guard?.id
        ? [{
            guardId: shift.guard.id,
            guardName: shift.guard.user
              ? `${shift.guard.user.firstName} ${shift.guard.user.lastName}`.trim()
              : 'Guard',
          }]
        : [],
    [shift?.guard?.id, shift?.guard?.user?.firstName, shift?.guard?.user?.lastName],
  );

  const isLiveShift = shift?.status === 'IN_PROGRESS' && !!shift?.guard?.id;

  const { guards: liveGuards } = useLiveGuardLocations({
    enabled: isLiveShift,
    supplementalGuards: supplementalLiveGuards,
    pollIntervalMs: 30000,
    locationUpdateThrottleMs: 5000,
  });

  const shiftLiveGuards = useMemo(
    () =>
      shift?.guard?.id
        ? liveGuards.filter((g) => g.guardId === shift.guard!.id)
        : [],
    [liveGuards, shift?.guard?.id],
  );

  const headerVariant =
    role === 'ADMIN' ? 'admin' : role === 'CLIENT' ? 'client' : 'guard';

  const loadShift = useCallback(async () => {
    try {
      setLoading(true);
      const response = await shiftApi.getShiftById(shiftId);
      if (response.success && response.data) {
        setShift(response.data);
      } else {
        Alert.alert('Error', response.message || 'Shift not found');
        navigation.goBack();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_shift_details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [shiftId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadShift();
    }, [loadShift])
  );

  const formatDateTime = (value?: string) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const guardFirstName = shift?.guard?.user?.firstName;
  const guardLastName = shift?.guard?.user?.lastName;
  const guardName =
    guardFirstName || guardLastName
      ? `${guardFirstName || ''} ${guardLastName || ''}`.trim()
      : 'Unassigned';

  const siteName = shift?.site?.name || shift?.locationName || 'Unknown site';
  const siteAddress = shift?.site?.address || shift?.locationAddress || '';
  const start = shift?.scheduledStartTime || shift?.startTime;
  const end = shift?.scheduledEndTime || shift?.endTime;
  const statusColor = getShiftStatusColor(shift?.status);
  const canEdit =
    (role === 'ADMIN' || role === 'CLIENT') && shift?.status === 'SCHEDULED';
  const canCheckIn = role === 'GUARD' && shift?.status === 'SCHEDULED';

  const handleEdit = () => {
    navigation.navigate('EditShift', { shiftId, shift });
  };

  const handleCancelShift = () => {
    Alert.alert('Cancel shift', 'This will remove the scheduled shift.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          const result =
            role === 'ADMIN'
              ? await shiftApi.deleteAdminShift(shiftId)
              : await clientApi.deleteClientShift(shiftId);
          if (result.success) {
            Alert.alert('Cancelled', 'Shift was cancelled.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } else {
            Alert.alert('Error', result.message || 'Could not cancel shift');
          }
        },
      },
    ]);
  };

  const handleCheckIn = async () => {
    try {
      const Geolocation = require('react-native-geolocation-service').default;
      const position = await new Promise<any>((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      const result = await shiftApi.checkInToShift(shiftId, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      if (result.success) {
        Alert.alert('Checked in', 'You are now on duty.');
        WebSocketService.connect();
        await locationTrackingService.initialize();
        await locationTrackingService.startTracking(shiftId);
        loadShift();
      } else {
        Alert.alert('Error', result.message || 'Check-in failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Check-in failed');
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant={headerVariant} title="Shift Details" showLogo={false} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!shift) return null;

  return (
    <SafeAreaWrapper>
      <SharedHeader variant={headerVariant} title="Shift Details" showLogo={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={[styles.summaryAccent, { backgroundColor: statusColor }]} />
          <View style={styles.summaryBody}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryTitleBlock}>
                <Text style={styles.summaryTitle}>{siteName}</Text>
                {siteAddress ? (
                  <Text style={styles.summarySubtitle}>{siteAddress}</Text>
                ) : null}
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>
                  {getShiftStatusLabel(shift.status)}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleRow}>
              <ClockIcon size={14} color={COLORS.primary} />
              <Text style={styles.scheduleText}>{formatShiftTimeRange(start, end)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow
            icon={<MapPinIcon size={18} color={COLORS.primary} />}
            label="Site"
            value={siteName}
            subValue={siteAddress || undefined}
          />

          <View style={styles.divider} />

          <DetailRow
            icon={<ClockIcon size={18} color={COLORS.primary} />}
            label="Schedule"
            value={formatDateTime(start)}
            subValue={`to ${formatDateTime(end)}`}
          />

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <ProfileAvatar
                firstName={guardFirstName}
                lastName={guardLastName}
                profilePictureUrl={pickProfilePictureUrl(shift.guard)}
                size={36}
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Guard</Text>
              <Text style={styles.detailValue}>{guardName}</Text>
              {!guardFirstName && !guardLastName ? (
                <Text style={styles.detailSubValue}>Awaiting guard assignment</Text>
              ) : null}
            </View>
          </View>

          {!!shift.description && (
            <>
              <View style={styles.divider} />
              <View style={styles.textBlock}>
                <View style={styles.textBlockHeader}>
                  <FileTextIcon size={16} color={COLORS.primary} />
                  <Text style={styles.textBlockLabel}>Description</Text>
                </View>
                <Text style={styles.textBlockBody}>{shift.description}</Text>
              </View>
            </>
          )}

          {!!shift.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.textBlock}>
                <Text style={styles.textBlockLabel}>Notes</Text>
                <Text style={styles.textBlockBody}>{shift.notes}</Text>
              </View>
            </>
          )}

          {(shift.checkInTime || shift.actualStartTime) && (
            <>
              <View style={styles.divider} />
              <DetailRow
                icon={<ClockIcon size={18} color={COLORS.success} />}
                label="Check-in"
                value={formatDateTime(shift.checkInTime || shift.actualStartTime)}
              />
            </>
          )}

          {(shift.checkOutTime || shift.actualEndTime) && (
            <>
              <View style={styles.divider} />
              <DetailRow
                icon={<ClockIcon size={18} color={COLORS.textSecondary} />}
                label="Check-out"
                value={formatDateTime(shift.checkOutTime || shift.actualEndTime)}
              />
            </>
          )}
        </View>

        {shift.status === 'IN_PROGRESS' && shift.guard?.id && (
          <View style={styles.mapCard}>
            <SectionHeader title="Live Guard Location" subtitle="Real-time position on site" />
            <InteractiveMapView
              height={220}
              showControls={true}
              liveGuards={shiftLiveGuards}
              enableLiveTracking={false}
              autoFit="once"
            />
          </View>
        )}

        {canCheckIn && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckIn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Check In</Text>
          </TouchableOpacity>
        )}

        {canEdit && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEdit} activeOpacity={0.85}>
              <EditIcon size={16} color={COLORS.textInverse} />
              <Text style={styles.primaryBtnText}>Edit Shift</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleCancelShift} activeOpacity={0.85}>
              <Text style={styles.dangerBtnText}>Cancel Shift</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
    backgroundColor: COLORS.backgroundSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  summaryAccent: {
    width: 4,
  },
  summaryBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  summaryTitleBlock: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  summarySubtitle: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: 20,
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
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scheduleText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  detailsCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  detailIconWrap: {
    width: 36,
    alignItems: 'center',
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  detailSubValue: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderCard,
    marginVertical: SPACING.md,
  },
  textBlock: {
    gap: SPACING.xs,
  },
  textBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  textBlockLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  textBlockBody: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  mapCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  primaryBtnText: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: COLORS.error + '55',
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actionRow: {
    gap: SPACING.sm,
  },
});

export default ShiftDetailsScreen;
