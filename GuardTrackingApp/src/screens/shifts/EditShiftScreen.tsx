/**
 * Edit Shift — Admin & Client (SCHEDULED shifts only)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { ClockIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import { formatShiftTimeRange } from '../../utils/shiftStatusUtils';
import { showSchedulingErrorAlert, showShiftActionError } from '../../utils/schedulingErrorAlert';
import { combineDateTime, formatDateInput, formatTimeInput } from '../../utils/shiftFormUtils';

const EditShiftScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { shiftId, shift: initialShift } = route.params as { shiftId: string; shift?: any };
  const { user } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || 'CLIENT').toUpperCase();

  const [loading, setLoading] = useState(!initialShift);
  const [shiftMeta, setShiftMeta] = useState<any>(initialShift || null);
  const [description, setDescription] = useState(initialShift?.description || '');
  const [notes, setNotes] = useState(initialShift?.notes || '');
  const [startDate, setStartDate] = useState(formatDateInput(initialShift?.scheduledStartTime || initialShift?.startTime));
  const [startTime, setStartTime] = useState(formatTimeInput(initialShift?.scheduledStartTime || initialShift?.startTime));
  const [endDate, setEndDate] = useState(formatDateInput(initialShift?.scheduledEndTime || initialShift?.endTime));
  const [endTime, setEndTime] = useState(formatTimeInput(initialShift?.scheduledEndTime || initialShift?.endTime));
  const [saving, setSaving] = useState(false);

  const headerVariant = role === 'ADMIN' ? 'admin' : 'client';

  const applyShiftToForm = (shift: any) => {
    setShiftMeta(shift);
    setDescription(shift?.description || '');
    setNotes(shift?.notes || '');
    setStartDate(formatDateInput(shift?.scheduledStartTime || shift?.startTime));
    setStartTime(formatTimeInput(shift?.scheduledStartTime || shift?.startTime));
    setEndDate(formatDateInput(shift?.scheduledEndTime || shift?.endTime));
    setEndTime(formatTimeInput(shift?.scheduledEndTime || shift?.endTime));
  };

  const loadShift = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getShiftById(shiftId);
      if (response.success && response.data) {
        if (response.data.status !== 'SCHEDULED') {
          Alert.alert('Cannot edit', 'Only scheduled shifts can be edited.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        applyShiftToForm(response.data);
      } else {
        Alert.alert('Error', response.message || 'Shift not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Failed to load shift', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [shiftId, navigation]);

  useEffect(() => {
    if (!initialShift) {
      loadShift();
    }
  }, [initialShift, loadShift]);

  const handleSave = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      Alert.alert('Missing fields', 'Please fill in all date and time fields.');
      return;
    }

    try {
      setSaving(true);
      const scheduledStartTime = combineDateTime(startDate, startTime);
      const scheduledEndTime = combineDateTime(endDate, endTime);

      if (new Date(scheduledStartTime) >= new Date(scheduledEndTime)) {
        Alert.alert('Invalid times', 'End time must be after start time.');
        return;
      }

      const payload = {
        scheduledStartTime,
        scheduledEndTime,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const result =
        role === 'ADMIN'
          ? await apiService.updateAdminShift(shiftId, payload)
          : await apiService.updateClientShift(shiftId, payload);

      if (result.success) {
        Alert.alert('Saved', 'Shift updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        showSchedulingErrorAlert(result.message || 'Update failed');
      }
    } catch (error: any) {
      showShiftActionError('Update Shift', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant={headerVariant} title="Edit Shift" showLogo={false} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  const guardName = shiftMeta?.guard?.user
    ? `${shiftMeta.guard.user.firstName || ''} ${shiftMeta.guard.user.lastName || ''}`.trim()
    : shiftMeta?.locationName || 'Scheduled shift';

  return (
    <SafeAreaWrapper>
      <SharedHeader variant={headerVariant} title="Edit Shift" showLogo={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <View style={styles.summaryAccent} />
          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>{guardName}</Text>
            <View style={styles.summaryRow}>
              <ClockIcon size={14} color={COLORS.primary} />
              <Text style={styles.summaryText}>
                {formatShiftTimeRange(
                  shiftMeta?.scheduledStartTime || shiftMeta?.startTime,
                  shiftMeta?.scheduledEndTime || shiftMeta?.endTime,
                )}
              </Text>
            </View>
            <Text style={styles.summaryHint}>
              Only scheduled shifts can be edited. Active or completed shifts are view-only.
            </Text>
          </View>
        </View>

        <SectionHeader title="Schedule" subtitle="Update shift start and end" />

        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Start date</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textTertiary}
          />

          <Text style={styles.fieldLabel}>Start time (24h)</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="HH:MM"
            placeholderTextColor={COLORS.textTertiary}
          />

          <Text style={styles.fieldLabel}>End date</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textTertiary}
          />

          <Text style={styles.fieldLabel}>End time (24h)</Text>
          <TextInput
            style={styles.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="HH:MM"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>

        <SectionHeader title="Details" subtitle="Optional shift notes" />

        <View style={styles.formCard}>
          <View style={styles.fieldHeader}>
            <FileTextIcon size={16} color={COLORS.primary} />
            <Text style={styles.fieldLabelInline}>Description</Text>
          </View>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Shift instructions for the guard..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
          />

          <Text style={styles.fieldLabel}>Internal notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes visible to your team..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
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
    backgroundColor: COLORS.primary,
  },
  summaryBody: {
    flex: 1,
    padding: SPACING.lg,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  summaryHint: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  formCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  fieldLabelInline: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.backgroundSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default EditShiftScreen;
