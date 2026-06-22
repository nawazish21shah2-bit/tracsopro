import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import FormInput from '../common/FormInput';
import { ReportType } from '../../types/shift.types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import ReportsActionBar from './ReportsActionBar';

interface ReportFormProps {
  onSubmit: (content: string, reportType: ReportType) => void;
  loading?: boolean;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, loading = false }) => {
  const [content, setContent] = useState('');
  const [reportType, setReportType] = useState<ReportType>(ReportType.SHIFT);

  const handleSubmit = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter report content');
      return;
    }
    onSubmit(content.trim(), reportType);
    setContent('');
  };

  const handleIncidentShortcut = () => {
    setReportType(ReportType.INCIDENT);
    if (!content.trim()) {
      setContent('No incidents occurred during my shift.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Report Input */}
      <View style={styles.inputContainer}>
        <FormInput
          value={content}
          onChangeText={setContent}
          placeholder="Enter your report details..."
          multiline
          numberOfLines={4}
          maxLength={500}
          helperText={`${content.length}/500`}
        />
      </View>

      <TouchableOpacity
        style={styles.incidentShortcut}
        onPress={handleIncidentShortcut}
        disabled={loading}
      >
        <Text style={styles.incidentShortcutText}>Use incident report template</Text>
      </TouchableOpacity>

      <ReportsActionBar layout="stack" requireActiveShift emergencySize="small" />

      {/* Submit Button */}
      {content.trim() && (
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  incidentShortcut: {
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  incidentShortcutText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textInverse,
  },
});

export default ReportForm;
