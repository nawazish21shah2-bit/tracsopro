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
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { MapPinIcon, ClockIcon, UserIcon } from '../../components/ui/FeatherIcons';
import { ErrorHandler } from '../../utils/errorHandler';
import InteractiveMapView from '../../components/client/InteractiveMapView';
import { useLiveGuardLocations } from '../../hooks/useLiveGuardLocations';
import locationTrackingService from '../../services/locationTrackingService';
import WebSocketService from '../../services/WebSocketService';

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
  guard?: { id: string; user?: { firstName: string; lastName: string } };
  site?: { id: string; name: string; address: string };
  client?: { id: string; user?: { firstName: string; lastName: string } };
}

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
      const response = await apiService.getShiftById(shiftId);
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

  const guardName = shift?.guard?.user
    ? `${shift.guard.user.firstName} ${shift.guard.user.lastName}`.trim()
    : 'Unassigned';

  const siteName = shift?.site?.name || shift?.locationName || 'Unknown site';
  const siteAddress = shift?.site?.address || shift?.locationAddress || '';
  const start = shift?.scheduledStartTime || shift?.startTime;
  const end = shift?.scheduledEndTime || shift?.endTime;
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
              ? await apiService.deleteAdminShift(shiftId)
              : await apiService.deleteClientShift(shiftId);
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
      const result = await apiService.checkInToShift(shiftId, {
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(shift.status) }]}>
          <Text style={styles.statusText}>{formatStatus(shift.status)}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <MapPinIcon size={18} color={COLORS.primary} />
            <View style={styles.rowText}>
              <Text style={styles.label}>Site</Text>
              <Text style={styles.value}>{siteName}</Text>
              {!!siteAddress && <Text style={styles.subValue}>{siteAddress}</Text>}
            </View>
          </View>

          <View style={styles.row}>
            <ClockIcon size={18} color={COLORS.primary} />
            <View style={styles.rowText}>
              <Text style={styles.label}>Schedule</Text>
              <Text style={styles.value}>{formatDateTime(start)}</Text>
              <Text style={styles.subValue}>to {formatDateTime(end)}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <UserIcon size={18} color={COLORS.primary} />
            <View style={styles.rowText}>
              <Text style={styles.label}>Guard</Text>
              <Text style={styles.value}>{guardName}</Text>
            </View>
          </View>

          {!!shift.description && (
            <View style={styles.notesBlock}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.subValue}>{shift.description}</Text>
            </View>
          )}

          {!!shift.notes && (
            <View style={styles.notesBlock}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.subValue}>{shift.notes}</Text>
            </View>
          )}

          {(shift.checkInTime || shift.actualStartTime) && (
            <View style={styles.notesBlock}>
              <Text style={styles.label}>Check-in</Text>
              <Text style={styles.subValue}>
                {formatDateTime(shift.checkInTime || shift.actualStartTime)}
              </Text>
            </View>
          )}
        </View>

        {shift.status === 'IN_PROGRESS' && shift.guard?.id && (
          <View style={styles.mapSection}>
            <Text style={styles.mapTitle}>Live Guard Location</Text>
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
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckIn}>
            <Text style={styles.primaryBtnText}>Check In</Text>
          </TouchableOpacity>
        )}

        {canEdit && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleEdit}>
              <Text style={styles.primaryBtnText}>Edit Shift</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleCancelShift}>
              <Text style={styles.dangerBtnText}>Cancel Shift</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const statusColor = (status: string) => {
  switch (status) {
    case 'IN_PROGRESS':
      return '#10B981';
    case 'COMPLETED':
      return '#3B82F6';
    case 'CANCELLED':
      return '#EF4444';
    default:
      return '#F59E0B';
  }
};

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.md,
  },
  statusText: { color: '#FFF', fontWeight: '600', fontSize: TYPOGRAPHY.fontSize.sm },
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    marginBottom: SPACING.lg,
  },
  row: { flexDirection: 'row', marginBottom: SPACING.lg, gap: SPACING.md },
  rowText: { flex: 1 },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  subValue: { fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.textSecondary, marginTop: 2 },
  notesBlock: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  mapSection: { marginBottom: SPACING.lg },
  mapTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '600', fontSize: TYPOGRAPHY.fontSize.md },
  dangerBtn: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  dangerBtnText: { color: COLORS.error, fontWeight: '600' },
  actionRow: { gap: SPACING.sm },
});

export default ShiftDetailsScreen;
