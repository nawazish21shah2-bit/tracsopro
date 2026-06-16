import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import EmergencyButton from '../emergency/EmergencyButton';
import { FileTextIcon, AlertCircleIcon } from '../ui/FeatherIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface ReportsActionBarProps {
  layout?: 'row' | 'stack';
  showIncident?: boolean;
  showEmergency?: boolean;
  requireActiveShift?: boolean;
  emergencySize?: 'small' | 'medium' | 'large';
  incidentRoute?: string;
  showHeader?: boolean;
}

const ReportsActionBar: React.FC<ReportsActionBarProps> = ({
  layout = 'row',
  showIncident = true,
  showEmergency = true,
  requireActiveShift = false,
  emergencySize = 'medium',
  incidentRoute = 'AddIncidentReport',
  showHeader = true,
}) => {
  const navigation = useNavigation<any>();
  const { activeShift } = useSelector((state: RootState) => state.shifts);

  const ensureActiveShift = (): boolean => {
    if (!requireActiveShift) return true;
    if (activeShift?.status === 'IN_PROGRESS' || activeShift?.checkInTime) {
      return true;
    }
    Alert.alert(
      'Shift Not Active',
      'Check in to your shift before submitting incident reports or emergency alerts.',
      [{ text: 'OK' }]
    );
    return false;
  };

  const handleIncidentPress = () => {
    if (!ensureActiveShift()) return;
    navigation.navigate(incidentRoute);
  };

  const isStack = layout === 'stack';
  const hasActiveShift = !!activeShift;

  return (
    <View style={styles.card}>
      {showHeader ? (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <Text style={styles.cardSubtitle}>Incident reporting & emergency SOS</Text>
        </View>
      ) : null}

      <View style={[styles.container, isStack && styles.containerStack]}>
        {showIncident ? (
          <TouchableOpacity
            style={[styles.incidentButton, isStack && styles.fullWidthButton]}
            onPress={handleIncidentPress}
            activeOpacity={0.85}
          >
            <View style={styles.incidentIconWrap}>
              <FileTextIcon size={18} color={COLORS.primary} />
            </View>
            <View style={styles.incidentTextBlock}>
              <Text style={styles.incidentButtonText}>Incident Report</Text>
              <Text style={styles.incidentHint}>Document an event on site</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {showEmergency ? (
          <View style={[styles.emergencySection, isStack && styles.emergencySectionStack]}>
            {requireActiveShift && !hasActiveShift ? (
              <TouchableOpacity
                style={[styles.emergencyDisabled, isStack && styles.fullWidthButton]}
                onPress={ensureActiveShift}
                activeOpacity={0.8}
              >
                <AlertCircleIcon size={18} color={COLORS.error} />
                <View style={styles.emergencyDisabledTextBlock}>
                  <Text style={styles.emergencyDisabledText}>Emergency SOS</Text>
                  <Text style={styles.emergencyDisabledHint}>Check in to enable</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.emergencyActive, isStack && styles.emergencyActiveStack]}>
                <View style={styles.sosRing}>
                  <EmergencyButton size={emergencySize} />
                </View>
                <Text style={styles.emergencyTitle}>Emergency SOS</Text>
                <Text style={styles.emergencyHint}>Tap to alert supervisors instantly</Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: SPACING.md,
  },
  containerStack: {
    flexDirection: 'column',
  },
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  incidentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentTextBlock: {
    flex: 1,
  },
  incidentButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primaryDark,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  incidentHint: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  fullWidthButton: {
    width: '100%',
  },
  emergencySection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencySectionStack: {
    paddingVertical: SPACING.sm,
  },
  emergencyActive: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error + '08',
    borderWidth: 1,
    borderColor: COLORS.error + '22',
    minWidth: 120,
  },
  emergencyActiveStack: {
    width: '100%',
    paddingVertical: SPACING.lg,
  },
  sosRing: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 2,
    borderColor: COLORS.error + '33',
    marginBottom: SPACING.sm,
  },
  emergencyTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.error,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emergencyHint: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emergencyDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    opacity: 0.85,
  },
  emergencyDisabledTextBlock: {
    flex: 1,
  },
  emergencyDisabledText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  emergencyDisabledHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});

export default ReportsActionBar;
