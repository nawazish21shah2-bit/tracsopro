import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MenuIcon, NotificationIcon, UserIcon } from './AppIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';
import GuardProfileDrawer from '../guard/GuardProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

interface GuardAppHeaderProps {
  title?: string;
  showLogo?: boolean;
  onNotificationPress?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToPastJobs?: () => void;
  onNavigateToAssignedSites?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSupport?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const GuardAppHeader: React.FC<GuardAppHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  onNavigateToProfile,
  onNavigateToPastJobs,
  onNavigateToAssignedSites,
  onNavigateToAttendance,
  onNavigateToNotifications,
  onNavigateToSupport,
  leftIcon,
  rightIcon,
  style,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    
    return (
      <TouchableOpacity style={styles.hamburgerButton} onPress={openDrawer}>
        <MenuIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderCenter = () => {
    if (showLogo) {
      return (
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage as ImageStyle} resizeMode="contain" />
        </View>
      );
    }
    if (title) {
      return <Text style={styles.title}>{title}</Text>;
    }
    return null;
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    
    const isActive = true; // This would come from actual guard status
    
    return (
      <View style={styles.rightContainer}>
        {onNotificationPress && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
            <NotificationIcon size={24} color={COLORS.textPrimary} />
            {/* Notification badge */}
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.profileIconButton} onPress={openDrawer}>
          <View style={[styles.profileAvatar, isActive && styles.profileAvatarActive]}>
            <UserIcon size={20} color={isActive ? '#FFFFFF' : COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View style={[styles.container, style]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
      
      <GuardProfileDrawer
        visible={isDrawerVisible}
        onClose={closeDrawer}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPastJobs={onNavigateToPastJobs}
        onNavigateToAssignedSites={onNavigateToAssignedSites}
        onNavigateToAttendance={onNavigateToAttendance}
        onNavigateToNotifications={onNavigateToNotifications}
        onNavigateToSupport={onNavigateToSupport}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    minHeight: 60,
    marginTop: 20,
  },
  hamburgerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 150,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  profileButtonActive: {
    backgroundColor: COLORS.primary,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  profileAvatarActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  profileNameActive: {
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCCCCC',
    marginRight: 4,
  },
  statusDotActive: {
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 10,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 30,
  },
});

export default GuardAppHeader;
