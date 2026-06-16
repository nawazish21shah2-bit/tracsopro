import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import SectionHeader from '../ui/SectionHeader';
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

      <Text style={styles.fieldLabel}>Start date</Text>
      <TextInput
        style={styles.input}
        value={values.startDate}
        onChangeText={(text) => onChange('startDate', text)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={COLORS.textTertiary}
      />

      <Text style={styles.fieldLabel}>Start time</Text>
      <TextInput
        style={styles.input}
        value={values.startTime}
        onChangeText={(text) => onChange('startTime', text)}
        placeholder="HH:MM"
        placeholderTextColor={COLORS.textTertiary}
      />

      <Text style={styles.fieldLabel}>End date</Text>
      <TextInput
        style={styles.input}
        value={values.endDate}
        onChangeText={(text) => onChange('endDate', text)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={COLORS.textTertiary}
      />

      <Text style={styles.fieldLabel}>End time</Text>
      <TextInput
        style={styles.input}
        value={values.endTime}
        onChangeText={(text) => onChange('endTime', text)}
        placeholder="HH:MM"
        placeholderTextColor={COLORS.textTertiary}
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
      <TextInput
        style={[styles.input, styles.multiline]}
        value={values.description}
        onChangeText={(text) => onChange('description', text)}
        placeholder="Shift duties or instructions..."
        placeholderTextColor={COLORS.textTertiary}
        multiline
      />

      <Text style={styles.fieldLabel}>Notes</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={values.notes}
        onChangeText={(text) => onChange('notes', text)}
        placeholder="Additional notes for your team..."
        placeholderTextColor={COLORS.textTertiary}
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
  repeatRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  repeatChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
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
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  repeatChipTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ShiftFormFields;
