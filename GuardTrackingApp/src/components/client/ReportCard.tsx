import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProfileAvatar from '../common/ProfileAvatar';
import { parseDisplayName } from '../../utils/parseDisplayName';
import StatusBadge from './StatusBadge';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { getReportSourceLabel } from '../../utils/reportUtils';

interface ReportCardProps {
  report: {
    id: string;
    source?: 'shift' | 'incident';
    type: 'Medical Emergency' | 'Incident' | 'Violation' | 'Maintenance';
    guardName: string;
    guardAvatar?: string;
    site: string;
    time: string;
    description: string;
    status: 'Respond' | 'New' | 'Reviewed';
    checkInTime?: string;
    guardId?: string;
  guardUserId?: string;
  };
  onPress?: () => void;
  onRespond?: () => void;
  onChatWithGuard?: (guardId: string, guardName: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onPress, onRespond, onChatWithGuard }) => {
  const getTypeIcon = () => {
    switch (report.type) {
      case 'Medical Emergency':
        return '🚨';
      case 'Incident':
        return '⚠️';
      case 'Violation':
        return '⚠️';
      case 'Maintenance':
        return '🔧';
      default:
        return '📋';
    }
  };

  const getTypeColor = () => {
    switch (report.type) {
      case 'Medical Emergency':
        return COLORS.error;
      case 'Incident':
        return COLORS.warning;
      case 'Violation':
        return COLORS.warning;
      case 'Maintenance':
        return COLORS.info;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <TouchableOpacity style={[styles.card]} onPress={onPress} activeOpacity={0.7}>
      {report.source ? (
        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel}>{getReportSourceLabel(report.source)}</Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor() + '15' }]}>
            <Text style={styles.typeEmoji}>{getTypeIcon()}</Text>
          </View>
          <View style={styles.typeInfo}>
            <Text style={[styles.typeText, { color: getTypeColor() }]}>{report.type}</Text>
            <Text style={styles.siteText}>{report.site} • {report.time}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <StatusBadge status={report.status} size="small" />
          {report.status === 'Respond' && onRespond && (
            <TouchableOpacity style={styles.respondButton} onPress={onRespond}>
              <Text style={styles.respondButtonText}>Respond</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.guardSection}>
        <Text style={styles.guardOnDutyLabel}>Guard On Duty</Text>
        <View style={styles.guardInfo}>
          <ProfileAvatar
            {...parseDisplayName(report.guardName)}
            profilePictureUrl={report.guardAvatar}
            size={40}
          />
          <View style={styles.guardDetails}>
            <Text style={styles.guardName}>{report.guardName}</Text>
            {report.checkInTime && (
              <Text style={styles.checkInTime}>Checked In at {report.checkInTime}</Text>
            )}
          </View>
          {onChatWithGuard && (report.guardId || report.guardUserId) && (
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => onChatWithGuard(report.guardUserId || report.guardId!, report.guardName)}
            >
              <Text style={styles.chatButtonText}>💬</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.description}>{report.description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.small,
  },
  sourceRow: {
    marginBottom: SPACING.sm,
  },
  sourceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primaryDark,
    fontFamily: TYPOGRAPHY.fontPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  typeEmoji: {
    fontSize: 18,
  },
  typeInfo: {
    flex: 1,
  },
  typeText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: 2,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  siteText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  respondButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    marginTop: SPACING.sm,
    ...SHADOWS.small,
  },
  respondButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  guardSection: {
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  guardOnDutyLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  guardDetails: {
    flex: 1,
  },
  guardName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  checkInTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    ...SHADOWS.small,
  },
  chatButtonText: {
    fontSize: 16,
  },
});

export default ReportCard;
