import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PersonIcon } from '../ui/AppIcons';
import { MessageCircle, User, Phone } from 'react-native-feather';
import StatusBadge from './StatusBadge';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

interface GuardCardProps {
  guard: {
    id: string;
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
  onChat?: (guardId: string, guardName: string) => void;
  onViewProfile?: (guardId: string) => void;
  onCall?: (phone: string) => void;
  showActionButtons?: boolean;
}

const GuardCard: React.FC<GuardCardProps> = ({ 
  guard, 
  onPress, 
  onChat, 
  onViewProfile,
  onCall,
  showActionButtons = false 
}) => {
  const handleChat = (e: any) => {
    e?.stopPropagation?.(); // Prevent card press when clicking chat button
    if (onChat) {
      onChat(guard.id, guard.name);
    }
  };

  const handleViewProfile = (e?: any) => {
    e?.stopPropagation?.(); // Prevent card press when clicking profile button
    if (onViewProfile) {
      onViewProfile(guard.id);
    } else if (onPress) {
      onPress();
    }
  };

  const handleCall = (e: any) => {
    e?.stopPropagation?.(); // Prevent card press when clicking call button
    if (onCall && guard.phone) {
      onCall(guard.phone);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={handleViewProfile} 
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.guardInfo}>
          <View style={styles.avatar}>
            {guard.avatar ? (
              <Image source={{ uri: guard.avatar }} style={styles.avatarImage} />
            ) : (
              <PersonIcon size={24} color="#666" />
            )}
          </View>
          <View style={styles.details}>
            <Text style={styles.name}>{guard.name}</Text>
            {guard.site && <Text style={styles.site}>{guard.site}</Text>}
            {showActionButtons && guard.pastJobs && (
              <Text style={styles.pastJobs}>Past Jobs: {guard.pastJobs}</Text>
            )}
            {showActionButtons && guard.rating && (
              <Text style={styles.rating}>Rating: {guard.rating}/5</Text>
            )}
            {showActionButtons && guard.availability && (
              <Text style={styles.availability}>Availability: {guard.availability}</Text>
            )}
          </View>
        </View>
        {showActionButtons ? (
          <View style={styles.actionButtons}>
            {onChat && (
              <TouchableOpacity 
                style={[styles.iconButton, styles.chatButton]} 
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleChat(e);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MessageCircle width={18} height={18} color={COLORS.primary} strokeWidth={2} />
              </TouchableOpacity>
            )}
            {onCall && guard.phone && (
              <TouchableOpacity 
                style={[styles.iconButton, styles.callButton]} 
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleCall(e);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Phone width={18} height={18} color={COLORS.success} strokeWidth={2} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.iconButton, styles.profileButton]} 
              onPress={(e) => {
                e?.stopPropagation?.();
                handleViewProfile(e);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <User width={18} height={18} color={COLORS.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        ) : (
          <StatusBadge status={guard.status} />
        )}
      </View>
      
      {!showActionButtons && (
        <View style={styles.shiftDetails}>
          <View style={styles.shiftInfo}>
            <Text style={styles.shiftTime}>{guard.shiftTime}</Text>
            {guard.status === 'Active' && guard.checkInTime && (
              <Text style={styles.checkInTime}>Checked in at {guard.checkInTime}</Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
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
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  site: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  pastJobs: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  rating: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  availability: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 6,
  },
  chatButton: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  callButton: {
    backgroundColor: COLORS.success + '20',
    borderColor: COLORS.success,
  },
  profileButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderColor: COLORS.borderLight,
  },
  shiftDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  shiftInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTime: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  checkInTime: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
});

export default GuardCard;
