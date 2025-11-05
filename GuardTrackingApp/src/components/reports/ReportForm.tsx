import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ReportType } from '../../types/shift.types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { IncidentIcon, EmergencyIcon } from '../ui/AppIcons';

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

  const handleIncidentReport = () => {
    setReportType(ReportType.INCIDENT);
    if (!content.trim()) {
      setContent('We had no incident occurred on the site, during my shift hours');
    }
  };

  const handleEmergencyAlert = () => {
    setReportType(ReportType.EMERGENCY);
    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to send an emergency alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Alert', 
          style: 'destructive',
          onPress: () => {
            if (!content.trim()) {
              setContent('Emergency situation reported');
            }
            onSubmit(content.trim() || 'Emergency situation reported', ReportType.EMERGENCY);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Report Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your report details..."
          placeholderTextColor={COLORS.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>{content.length}/500</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.incidentButton} 
          onPress={handleIncidentReport}
          disabled={loading}
        >
          <IncidentIcon size={20} color={COLORS.textInverse} />
          <Text style={styles.incidentButtonText}>Add Incident Report</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.emergencyButton} 
          onPress={handleEmergencyAlert}
          disabled={loading}
        >
          <EmergencyIcon size={20} color={COLORS.textInverse} />
          <Text style={styles.emergencyButtonText}>Emergency Alert</Text>
        </TouchableOpacity>
      </View>

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
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    minHeight: 100,
    maxHeight: 150,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  incidentButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textInverse,
    marginLeft: SPACING.xs,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  emergencyButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    color: COLORS.textInverse,
    marginLeft: SPACING.xs,
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
