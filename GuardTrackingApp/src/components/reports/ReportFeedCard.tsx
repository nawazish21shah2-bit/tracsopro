import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { MapPinIcon, ClockIcon, ArrowRightIcon } from '../ui/FeatherIcons';
import { getReportSourceLabel, formatReportDateTime, ReportSource } from '../../utils/reportUtils';

interface ReportFeedCardProps {
  locationName: string;
  locationAddress?: string;
  source: ReportSource;
  title: string;
  description: string;
  statusLabel: string;
  statusColor: string;
  submittedAt: string;
  onPress?: () => void;
}

const ReportFeedCard: React.FC<ReportFeedCardProps> = ({
  locationName,
  locationAddress,
  source,
  title,
  description,
  statusLabel,
  statusColor,
  submittedAt,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={onPress ? 0.75 : 1}
    disabled={!onPress}
  >
    <View style={[styles.accent, { backgroundColor: statusColor }]} />

    <View style={styles.body}>
      <View style={styles.topRow}>
        <View style={[styles.sourcePill, source === 'shift' ? styles.sourcePillShift : styles.sourcePillIncident]}>
          <Text style={[styles.sourceText, source === 'shift' ? styles.sourceTextShift : styles.sourceTextIncident]}>
            {getReportSourceLabel(source)}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.reportTitle} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.metaRow}>
        <MapPinIcon size={14} color={COLORS.primary} />
        <View style={styles.metaTextBlock}>
          <Text style={styles.locationName} numberOfLines={1}>
            {locationName}
          </Text>
          {locationAddress ? (
            <Text style={styles.locationAddress} numberOfLines={1}>
              {locationAddress}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.timeRow}>
          <ClockIcon size={13} color={COLORS.textTertiary} />
          <Text style={styles.timeText}>{formatReportDateTime(submittedAt)}</Text>
        </View>
        {onPress ? (
          <View style={styles.viewLink}>
            <Text style={styles.viewLinkText}>Details</Text>
            <ArrowRightIcon size={14} color={COLORS.primary} />
          </View>
        ) : null}
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sourcePill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  sourcePillIncident: {
    backgroundColor: COLORS.primaryLight + '55',
  },
  sourcePillShift: {
    backgroundColor: COLORS.secondary,
  },
  sourceText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  sourceTextIncident: {
    color: COLORS.primaryDark,
  },
  sourceTextShift: {
    color: COLORS.primary,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
    textTransform: 'capitalize',
  },
  reportTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metaTextBlock: {
    flex: 1,
  },
  locationName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  locationAddress: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  timeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewLinkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default ReportFeedCard;
