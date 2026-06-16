import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { ClockIcon, UserIcon, EditIcon, FileTextIcon } from '../ui/FeatherIcons';
import ProfileAvatar from '../common/ProfileAvatar';
import {
  getShiftStatusColor,
  getShiftStatusLabel,
  formatShiftTimeRange,
} from '../../utils/shiftStatusUtils';
import { pickProfilePictureUrl } from '../../utils/profilePictureUtils';

export interface SiteShiftItem {
  id: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  description?: string;
  notes?: string;
  guard?: {
    profilePictureUrl?: string | null;
    user?: {
      firstName?: string;
      lastName?: string;
      profilePictureUrl?: string | null;
    };
  };
}

interface SiteShiftCardProps {
  shift: SiteShiftItem;
  onDetails: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

const SiteShiftCard: React.FC<SiteShiftCardProps> = ({
  shift,
  onDetails,
  onEdit,
  onCancel,
}) => {
  const statusColor = getShiftStatusColor(shift.status);
  const canModify = shift.status === 'SCHEDULED';
  const guardFirst = shift.guard?.user?.firstName;
  const guardLast = shift.guard?.user?.lastName;
  const guardName =
    guardFirst || guardLast
      ? `${guardFirst || ''} ${guardLast || ''}`.trim()
      : 'Unassigned';

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: statusColor }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.guardName}>{guardName}</Text>
            {shift.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {shift.description}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getShiftStatusLabel(shift.status)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <ClockIcon size={14} color={COLORS.primary} />
          <Text style={styles.metaText}>
            {formatShiftTimeRange(shift.scheduledStartTime, shift.scheduledEndTime)}
          </Text>
        </View>

        {!guardFirst && !guardLast ? (
          <View style={styles.metaRow}>
            <UserIcon size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaHint}>Awaiting guard assignment</Text>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <ProfileAvatar
              firstName={guardFirst}
              lastName={guardLast}
              profilePictureUrl={pickProfilePictureUrl(shift.guard)}
              size={22}
            />
            <Text style={styles.metaHint}>Assigned guard</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onDetails} activeOpacity={0.85}>
            <FileTextIcon size={14} color={COLORS.primary} />
            <Text style={styles.actionTextPrimary}>Details</Text>
          </TouchableOpacity>

          {canModify && onEdit ? (
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={onEdit} activeOpacity={0.85}>
              <EditIcon size={14} color={COLORS.textInverse} />
              <Text style={styles.actionTextInverse}>Edit</Text>
            </TouchableOpacity>
          ) : null}

          {canModify && onCancel ? (
            <TouchableOpacity style={styles.actionBtnDanger} onPress={onCancel} activeOpacity={0.85}>
              <Text style={styles.actionTextDanger}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  titleBlock: {
    flex: 1,
  },
  guardName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  description: {
    marginTop: 2,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
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
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  metaText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  metaHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  actionBtnDanger: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '33',
  },
  actionTextPrimary: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actionTextInverse: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actionTextDanger: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.error,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
});

export default SiteShiftCard;
