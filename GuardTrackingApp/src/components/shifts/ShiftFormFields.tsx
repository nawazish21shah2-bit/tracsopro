import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SectionHeader from '../ui/SectionHeader';
import FormInput from '../common/FormInput';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { ClockIcon, FileTextIcon } from '../ui/FeatherIcons';
import { ScheduleRepeat } from '../../utils/shiftFormUtils';

export interface ShiftFormValues {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  scheduleRepeat: ScheduleRepeat;
  description: string;
  notes: string;
}

interface ShiftFormFieldsProps {
  values: ShiftFormValues;
  onChange: <K extends keyof ShiftFormValues>(field: K, value: ShiftFormValues[K]) => void;
  showRepeat?: boolean;
}

const ShiftFormFields: React.FC<ShiftFormFieldsProps> = ({
  values,
  onChange,
  showRepeat = true,
}) => (
  <>
    <SectionHeader title="Schedule" subtitle="Set shift start and end (24h time)" />

    <View style={styles.formCard}>
      <View style={styles.fieldHeader}>
        <ClockIcon size={16} color={COLORS.primary} />
        <Text style={styles.fieldLabelInline}>When</Text>
      </View>

      <FormInput
        label="Start date"
        value={values.startDate}
        onChangeText={(text) => onChange('startDate', text)}
        placeholder="YYYY-MM-DD"
        containerStyle={styles.fieldSpacing}
      />

      <FormInput
        label="Start time"
        value={values.startTime}
        onChangeText={(text) => onChange('startTime', text)}
        placeholder="HH:MM"
        containerStyle={styles.fieldSpacing}
      />

      <FormInput
        label="End date"
        value={values.endDate}
        onChangeText={(text) => onChange('endDate', text)}
        placeholder="YYYY-MM-DD"
        containerStyle={styles.fieldSpacing}
      />

      <FormInput
        label="End time"
        value={values.endTime}
        onChangeText={(text) => onChange('endTime', text)}
        placeholder="HH:MM"
      />
    </View>

    {showRepeat ? (
      <>
        <SectionHeader title="Repeat" subtitle="Schedule multiple shifts at once" />
        <View style={styles.repeatRow}>
          {(['none', 'week', 'month'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.repeatChip, values.scheduleRepeat === opt && styles.repeatChipActive]}
              onPress={() => onChange('scheduleRepeat', opt)}
            >
              <Text
                style={[
                  styles.repeatChipText,
                  values.scheduleRepeat === opt && styles.repeatChipTextActive,
                ]}
              >
                {opt === 'none' ? 'Single' : opt === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ) : null}

    <SectionHeader title="Details" subtitle="Optional instructions for the guard" />

    <View style={styles.formCard}>
      <View style={styles.fieldHeader}>
        <FileTextIcon size={16} color={COLORS.primary} />
        <Text style={styles.fieldLabelInline}>Description</Text>
      </View>
      <FormInput
        value={values.description}
        onChangeText={(text) => onChange('description', text)}
        placeholder="Shift duties or instructions..."
        multiline
        containerStyle={styles.fieldSpacing}
      />

      <FormInput
        label="Notes"
        value={values.notes}
        onChangeText={(text) => onChange('notes', text)}
        placeholder="Additional notes for your team..."
        multiline
      />
    </View>
  </>
);

const styles = StyleSheet.create({
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
  fieldLabelInline: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  fieldSpacing: {
    marginBottom: SPACING.md,
  },
  repeatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  repeatChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.backgroundPrimary,
  },
  repeatChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  repeatChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  repeatChipTextActive: {
    color: COLORS.textInverse,
  },
});

export default ShiftFormFields;
