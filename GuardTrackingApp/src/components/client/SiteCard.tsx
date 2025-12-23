import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PersonIcon, LocationIcon } from '../ui/AppIcons';
import { EyeIcon, EditIcon, TrashIcon } from '../ui/FeatherIcons';
import StatusBadge from './StatusBadge';
import SiteCardDropdown from './SiteCardDropdown';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

interface SiteCardProps {
  site: {
    id: string;
    name: string;
    address: string;
    guardName: string;
    guardAvatar?: string;
    status: 'Active' | 'Upcoming' | 'Missed';
    shiftTime?: string;
    checkInTime?: string;
    guardId?: string;
  };
  onPress?: () => void;
  onView?: (siteId: string) => void;
  onEdit?: (siteId: string) => void;
  onDelete?: (siteId: string) => void;
  onChatWithGuard?: (guardId: string, guardName: string) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ 
  site, 
  onPress, 
  onView, 
  onEdit, 
  onDelete, 
  onChatWithGuard 
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState({ x: 0, y: 0 });
  const moreButtonRef = useRef<TouchableOpacity>(null);

  if (!site || !site.id) {
    return null;
  }

  const handleMoreOptionsPress = () => {
    if (moreButtonRef.current) {
      moreButtonRef.current.measureInWindow((x, y, width, height) => {
        setAnchorPosition({ x: x + width, y: y });
        setDropdownVisible(true);
      });
    }
  };

  const handleCardPress = () => {
    if (dropdownVisible) {
      setDropdownVisible(false);
    } else if (onPress) {
      onPress();
    }
  };

  const actions = [];
  
  if (onView) {
    actions.push({
      label: 'View Details',
      icon: <EyeIcon size={18} color={COLORS.textPrimary} />,
      onPress: () => onView(site.id),
    });
  }

  if (onEdit) {
    actions.push({
      label: 'Edit Site',
      icon: <EditIcon size={18} color={COLORS.textPrimary} />,
      onPress: () => onEdit(site.id),
    });
  }

  if (onDelete) {
    actions.push({
      label: 'Delete Site',
      icon: <TrashIcon size={18} color={COLORS.error || '#DC2626'} />,
      onPress: () => onDelete(site.id),
      destructive: true,
    });
  }

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={handleCardPress} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={styles.siteInfo}>
            <View style={styles.locationIcon}>
              <LocationIcon size={20} color="#1976D2" />
            </View>
            <View style={styles.siteDetails}>
              <Text style={styles.siteName} numberOfLines={1}>
                {site.name || 'Unnamed Site'}
              </Text>
              <Text style={styles.siteAddress} numberOfLines={2}>
                {site.address || 'No address'}
              </Text>
            </View>
          </View>
          {actions.length > 0 && (
            <TouchableOpacity 
              ref={moreButtonRef}
              style={styles.moreButton} 
              onPress={handleMoreOptionsPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.moreButtonText}>•••</Text>
            </TouchableOpacity>
          )}
        </View>

      <View style={styles.guardSection}>
        <Text style={styles.guardOnDutyLabel}>Guard On Duty</Text>
        <View style={styles.guardInfo}>
          <View style={styles.avatar}>
            {site.guardAvatar ? (
              <Image 
                source={{ uri: site.guardAvatar }} 
                style={styles.avatarImage}
                defaultSource={{ uri: 'https://via.placeholder.com/32x32/E5E7EB/9CA3AF?text=?' }}
              />
            ) : (
              <PersonIcon size={20} color="#666" />
            )}
          </View>
          <View style={styles.guardDetails}>
            <Text style={styles.guardName} numberOfLines={1}>
              {site.guardName || 'No guard assigned'}
            </Text>
            {site.shiftTime ? (
              <Text style={styles.shiftTime} numberOfLines={1}>
                {site.shiftTime}
              </Text>
            ) : null}
            {site.status === 'Active' && site.checkInTime ? (
              <Text style={styles.checkInTime} numberOfLines={1}>
                Checked in at {site.checkInTime}
              </Text>
            ) : null}
          </View>
          <View style={styles.rightSection}>
            {onChatWithGuard && site.guardId && site.status === 'Active' ? (
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => {
                  if (site.guardId && site.guardName) {
                    onChatWithGuard(site.guardId, site.guardName);
                  }
                }}
              >
                <Text style={styles.chatButtonText}>💬</Text>
              </TouchableOpacity>
            ) : null}
            <StatusBadge status={site.status} size="small" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
    <SiteCardDropdown
      visible={dropdownVisible}
      onClose={() => setDropdownVisible(false)}
      actions={actions}
      anchorPosition={anchorPosition}
    />
    </>
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
    alignItems: 'flex-start',
    marginBottom: SPACING.fieldGap || SPACING.lg,
  },
  siteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  siteDetails: {
    flex: 1,
  },
  siteName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  siteAddress: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  guardSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  guardOnDutyLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  guardDetails: {
    flex: 1,
  },
  guardName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  shiftTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  checkInTime: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chatButtonText: {
    fontSize: 14,
  },
});

export default SiteCard;
