import React, { useCallback, useEffect, useState } from 'react';
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
import { MapPin } from 'react-native-feather';
import apiService from '../../services/api';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import ShiftFormFields, { ShiftFormValues } from '../../components/shifts/ShiftFormFields';
import ShiftOptionPicker from '../../components/shifts/ShiftOptionPicker';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import {
  combineDateTime,
  getDefaultShiftSchedule,
  getRepeatSuccessMessage,
  validateShiftSchedule,
} from '../../utils/shiftFormUtils';
import { showSchedulingErrorAlert, showShiftActionError } from '../../utils/schedulingErrorAlert';

const CreateShiftScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const siteId = (route.params as { siteId?: string })?.siteId;

  const [loading, setLoading] = useState(false);
  const [siteInfo, setSiteInfo] = useState<{ name: string; address: string } | null>(null);
  const [availableGuards, setAvailableGuards] = useState<any[]>([]);
  const [guardId, setGuardId] = useState<string | undefined>();
  const [formValues, setFormValues] = useState<ShiftFormValues>(() => {
    const defaults = getDefaultShiftSchedule();
    return {
      ...defaults,
      scheduleRepeat: 'none',
      description: '',
      notes: '',
    };
  });

  const handleFormChange = useCallback(
    <K extends keyof ShiftFormValues>(field: K, value: ShiftFormValues[K]) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  useEffect(() => {
    if (!siteId) {
      Alert.alert(
        'Error',
        'Site ID is required to create a shift. Please select a site first.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
      return;
    }
    fetchSiteInfo();
    fetchAvailableGuards();
  }, [siteId]);

  const fetchSiteInfo = async () => {
    try {
      const result = await apiService.getClientSites(1, 100);
      if (result.success && result.data?.sites) {
        const site = result.data.sites.find((s: any) => s.id === siteId);
        if (site) {
          setSiteInfo({
            name: site.name || 'Site Location',
            address: site.address || 'Site Address',
          });
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching site info:', error);
      }
    }
  };

  const fetchAvailableGuards = async () => {
    try {
      const result = await apiService.getClientGuards(1, 100);
      if (result.success && result.data) {
        const guards = result.data.guards || result.data.items || [];
        setAvailableGuards(guards);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching guards:', error);
      }
    }
  };

  const guardOptions = availableGuards.map((guard) => {
    const firstName = guard.user?.firstName || guard.firstName || '';
    const lastName = guard.user?.lastName || guard.lastName || '';
    const label = `${firstName} ${lastName}`.trim() || guard.email || 'Unknown Guard';
    return { id: guard.id, label };
  });

  const handleCreateShift = async () => {
    const validation = validateShiftSchedule(
      formValues.startDate,
      formValues.startTime,
      formValues.endDate,
      formValues.endTime,
      { requireFuture: true },
    );
    if (!validation.valid) {
      Alert.alert('Error', validation.message);
      return;
    }

    if (!siteId) {
      Alert.alert('Error', 'Site ID is required');
      return;
    }

    setLoading(true);
    try {
      const scheduledStartTime = combineDateTime(formValues.startDate, formValues.startTime);
      const scheduledEndTime = combineDateTime(formValues.endDate, formValues.endTime);

      const shiftData = {
        siteId,
        guardId: guardId || undefined,
        scheduledStartTime,
        scheduledEndTime,
        description: formValues.description.trim() || undefined,
        notes: formValues.notes.trim() || undefined,
        ...(formValues.scheduleRepeat !== 'none'
          ? { repeatPattern: formValues.scheduleRepeat as 'week' | 'month' }
          : {}),
      };

      const result = await apiService.createClientShift(shiftData);

      if (result.success) {
        Alert.alert('Success', getRepeatSuccessMessage(formValues.scheduleRepeat), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        showSchedulingErrorAlert(result.message || 'Failed to create shift. Please try again.');
      }
    } catch (error: any) {
      showShiftActionError('Create Shift', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader variant="client" title="Create Shift" showLogo={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {siteInfo ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryAccent} />
            <View style={styles.summaryBody}>
              <View style={styles.summaryRow}>
                <MapPin width={16} height={16} color={COLORS.primary} />
                <Text style={styles.summaryTitle}>{siteInfo.name}</Text>
              </View>
              <Text style={styles.summaryText}>{siteInfo.address}</Text>
            </View>
          </View>
        ) : null}

        <SectionHeader title="Assignment" subtitle="Optionally assign a guard now" />

        <View style={styles.formCard}>
          <ShiftOptionPicker
            label="Guard"
            placeholder="Select guard (optional)"
            options={guardOptions}
            selectedId={guardId}
            onSelect={setGuardId}
            allowNone
            noneLabel="No guard yet"
            noneSublabel="Admin or you can assign later"
          />
        </View>

        <ShiftFormFields values={formValues} onChange={handleFormChange} />

        <TouchableOpacity
          style={[styles.createBtn, loading && styles.createBtnDisabled]}
          onPress={handleCreateShift}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <Text style={styles.createBtnText}>Create Shift</Text>
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  summaryText: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
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
  createBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  createBtnDisabled: {
    opacity: 0.7,
  },
  createBtnText: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default CreateShiftScreen;
