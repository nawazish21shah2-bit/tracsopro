import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { BellIcon, AlertCircleIcon } from '../ui/FeatherIcons';
import { EmergencyIcon } from '../ui/AppIcons';

export interface EmergencyAlertItem {
  id: string;
  guardName?: string;
  message?: string;
  type?: string;
  severity?: string;
  timestamp?: number | string;
  createdAt?: string;
  status?: string;
}

interface EmergencyAlertsPanelProps {
  alerts: EmergencyAlertItem[];
  loading?: boolean;
  title?: string;
  onAcknowledge?: (alertId: string) => void;
  onViewReports?: () => void;
  acknowledgeLabel?: string;
  compact?: boolean;
  acknowledgingAlertId?: string | null;
}

function getAlertTimestamp(alert: EmergencyAlertItem): number {
  if (typeof alert.timestamp === 'number') return alert.timestamp;
  if (alert.createdAt) return new Date(alert.createdAt).getTime();
  if (typeof alert.timestamp === 'string') return new Date(alert.timestamp).getTime();
  return Date.now();
}

export function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} d ago`;
}

function getSeverityLabel(type?: string, severity?: string): string {
  if (severity) return severity;
  if (type) return type.replace(/_/g, ' ');
  return 'Critical';
}

const EmergencyAlertsPanel: React.FC<EmergencyAlertsPanelProps> = ({
  alerts,
  loading = false,
  title = 'Active Emergency',
  onAcknowledge,
  onViewReports,
  acknowledgeLabel = 'Acknowledge',
  compact = false,
  acknowledgingAlertId = null,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={COLORS.error} />
        <Text style={styles.loadingText}>Checking for emergencies...</Text>
      </View>
    );
  }

  if (!alerts.length) {
    return null;
  }

  return (
    <View style={[styles.section, compact && styles.sectionCompact]}>
      <View style={styles.liveStripe} />

      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrap}>
              <EmergencyIcon size={20} color={COLORS.error} />
            </View>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>
                {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} require attention
              </Text>
            </View>
          </View>
          {onViewReports ? (
            <TouchableOpacity style={styles.linkButton} onPress={onViewReports} activeOpacity={0.8}>
              <Text style={styles.link}>Reports</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {alerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertAccent} />
            <View style={styles.alertBody}>
              <View style={styles.alertTop}>
                <Text style={styles.guardName}>{alert.guardName || 'Guard'}</Text>
                <View style={styles.severityChip}>
                  <AlertCircleIcon size={12} color={COLORS.error} />
                  <Text style={styles.severityText}>
                    {getSeverityLabel(alert.type, alert.severity)}
                  </Text>
                </View>
              </View>
              <Text style={styles.message} numberOfLines={2}>
                {alert.message || `${alert.type || 'Emergency'} alert triggered`}
              </Text>
              <Text style={styles.time}>{formatTimeAgo(getAlertTimestamp(alert))}</Text>
            </View>
            {onAcknowledge ? (
              <TouchableOpacity
                style={[
                  styles.ackButton,
                  acknowledgingAlertId === alert.id && styles.ackButtonDisabled,
                ]}
                onPress={() => onAcknowledge(alert.id)}
                activeOpacity={0.85}
                disabled={!!acknowledgingAlertId}
              >
                {acknowledgingAlertId === alert.id ? (
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <>
                    <BellIcon size={15} color={COLORS.textInverse} />
                    <Text style={styles.ackText}>{acknowledgeLabel}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  sectionCompact: {
    marginHorizontal: 0,
  },
  liveStripe: {
    height: 3,
    backgroundColor: COLORS.error,
  },
  inner: {
    padding: SPACING.lg,
    backgroundColor: COLORS.error + '06',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error + '14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.error + '25',
  },
  headerText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.error + '18',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
  },
  liveText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.error,
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  linkButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  link: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
  },
  alertAccent: {
    width: 3,
    backgroundColor: COLORS.error,
  },
  alertBody: {
    flex: 1,
    padding: SPACING.md,
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  guardName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.error + '10',
  },
  severityText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.error,
    textTransform: 'uppercase',
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  time: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  ackButton: {
    alignSelf: 'center',
    marginRight: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 96,
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  ackButtonDisabled: {
    opacity: 0.7,
  },
  ackText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default EmergencyAlertsPanel;
