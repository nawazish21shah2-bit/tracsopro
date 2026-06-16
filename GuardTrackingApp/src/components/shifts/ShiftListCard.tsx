import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { ClockIcon, UserIcon } from '../ui/FeatherIcons';
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
  footerLabel = 'View details →',
}) => {
  const statusColor = getShiftStatusColor(status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getShiftStatusLabel(status)}
          </Text>
        </View>
      </View>

      {(guardFirstName || guardLastName) ? (
        <View style={styles.row}>
          <ProfileAvatar
            firstName={guardFirstName}
            lastName={guardLastName}
            profilePictureUrl={guardProfilePictureUrl}
            size={22}
          />
          <Text style={styles.rowText} numberOfLines={1}>
            {[guardFirstName, guardLastName].filter(Boolean).join(' ')}
          </Text>
        </View>
      ) : guardLabel ? (
        <View style={styles.row}>
          <UserIcon size={14} color={COLORS.textSecondary} />
          <Text style={styles.rowText} numberOfLines={1}>
            {guardLabel}
          </Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <ClockIcon size={14} color={COLORS.textSecondary} />
        <Text style={styles.rowText}>{formatShiftTimeRange(startTime, endTime)}</Text>
      </View>

      {onPress ? <Text style={styles.footer}>{footerLabel}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
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
  },
  subtitle: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    fontFamily: TYPOGRAPHY.fontPrimary,
    textTransform: 'capitalize',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  rowText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
});

export default ShiftListCard;
