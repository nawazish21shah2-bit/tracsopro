import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { ClockIcon, UserIcon, FileTextIcon } from '../ui/FeatherIcons';
import ProfileAvatar from '../common/ProfileAvatar';
import {
  getShiftStatusColor,
  getShiftStatusLabel,
  formatShiftTimeRange,
} from '../../utils/shiftStatusUtils';

interface ShiftListCardProps {
  title: string;
  subtitle?: string;
  guardFirstName?: string;
  guardLastName?: string;
  guardProfilePictureUrl?: string | null;
  guardLabel?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  onPress?: () => void;
  footerLabel?: string;
}

const ShiftListCard: React.FC<ShiftListCardProps> = ({
  title,
  subtitle,
  guardFirstName,
  guardLastName,
  guardProfilePictureUrl,
  guardLabel,
  startTime,
  endTime,
  status,
  onPress,
  footerLabel = 'View Details',
}) => {
  const statusColor = getShiftStatusColor(status);
  const hasGuard = Boolean(guardFirstName || guardLastName);

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: statusColor }]} />

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getShiftStatusLabel(status)}
            </Text>
          </View>
        </View>

        {hasGuard ? (
          <View style={styles.metaRow}>
            <ProfileAvatar
              firstName={guardFirstName}
              lastName={guardLastName}
              profilePictureUrl={guardProfilePictureUrl}
              size={28}
            />
            <Text style={styles.guardName} numberOfLines={1}>
              {[guardFirstName, guardLastName].filter(Boolean).join(' ')}
            </Text>
          </View>
        ) : guardLabel ? (
          <View style={styles.metaRow}>
            <View style={styles.guardPlaceholder}>
              <UserIcon size={14} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.guardNameMuted} numberOfLines={1}>
              {guardLabel}
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <ClockIcon size={14} color={COLORS.primary} />
          <Text style={styles.metaText}>{formatShiftTimeRange(startTime, endTime)}</Text>
        </View>

        {onPress ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.detailsBtn} onPress={onPress} activeOpacity={0.85}>
              <FileTextIcon size={14} color={COLORS.primary} />
              <Text style={styles.detailsBtnText}>{footerLabel}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
};

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    lineHeight: 18,
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
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  guardPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  guardNameMuted: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  metaText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actions: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  detailsBtnText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default ShiftListCard;
