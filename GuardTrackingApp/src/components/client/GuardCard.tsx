import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MessageCircle, User } from 'react-native-feather';
import ProfileAvatar from '../common/ProfileAvatar';
import { parseDisplayName } from '../../utils/parseDisplayName';
import StatusBadge from './StatusBadge';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface GuardCardProps {
  guard: {
    id: string;
    userId?: string;
    name: string;
    avatar?: string;
    site?: string;
    shiftTime?: string;
    status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
    checkInTime?: string;
    checkOutTime?: string;
    pastJobs?: number;
    rating?: number;
    availability?: string;
    phone?: string;
  };
  onPress?: () => void;
  onChat?: (guardUserId: string, guardName: string, avatar?: string, guardEntityId?: string) => void;
  onViewProfile?: (guardId: string) => void;
  onCall?: (phone: string) => void;
  showActionButtons?: boolean;
  chatLoading?: boolean;
}

const GuardCard: React.FC<GuardCardProps> = ({
  guard,
  onPress,
  onChat,
  onViewProfile,
  onCall,
  showActionButtons = false,
  chatLoading = false,
}) => {
  const handleChat = () => {
    if (!onChat || !guard.userId || chatLoading) return;
    onChat(guard.userId, guard.name, guard.avatar, guard.id);
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(guard.id);
    } else if (onPress) {
      onPress();
    }
  };

  const handleCall = () => {
    if (onCall && guard.phone) {
      onCall(guard.phone);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleViewProfile}
      activeOpacity={0.75}
    >
      <View style={styles.accent} />

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.guardInfo}>
            <ProfileAvatar
              {...parseDisplayName(guard.name)}
              profilePictureUrl={guard.avatar}
              size={48}
            />
            <View style={styles.details}>
              <Text style={styles.name}>{guard.name}</Text>
              {guard.site ? <Text style={styles.site}>{guard.site}</Text> : null}
              {guard.shiftTime && !showActionButtons ? (
                <Text style={styles.shiftTime}>{guard.shiftTime}</Text>
              ) : null}
            </View>
          </View>

          {showActionButtons ? (
            <View style={styles.actionButtons}>
              {onChat ? (
                <TouchableOpacity
                  style={[styles.iconButton, styles.chatButton, (!guard.userId || chatLoading) && styles.iconDisabled]}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleChat();
                  }}
                  disabled={!guard.userId || chatLoading}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {chatLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <MessageCircle width={18} height={18} color={COLORS.primary} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.iconButton, styles.profileButton]}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleViewProfile();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <User width={18} height={18} color={COLORS.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ) : (
            <StatusBadge status={guard.status} />
          )}
        </View>

        {!showActionButtons && guard.status === 'Active' && guard.checkInTime ? (
          <Text style={styles.checkInTime}>Checked in at {guard.checkInTime}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
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
    backgroundColor: COLORS.primary,
  },
  body: {
    flex: 1,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
    gap: SPACING.md,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  site: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  shiftTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginTop: 4,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  checkInTime: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconDisabled: {
    opacity: 0.5,
  },
  chatButton: {
    backgroundColor: COLORS.primaryLight + '55',
    borderColor: COLORS.primary + '44',
  },
  callButton: {
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success + '44',
  },
  profileButton: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.borderCard,
  },
});

export default GuardCard;
