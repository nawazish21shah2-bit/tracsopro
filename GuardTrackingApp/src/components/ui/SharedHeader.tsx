import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ViewStyle, ImageStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {  NotificationIcon, EmergencyIcon, SettingsIcon } from './AppIcons';
import { MenuIcon, BellIcon } from './FeatherIcons';

import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

// Header variant types
export type HeaderVariant = 'auth' | 'dashboard' | 'client' | 'guard' | 'admin' | 'default';

// Base props for all headers
interface BaseHeaderProps {
  variant?: HeaderVariant;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  style?: ViewStyle;
}

// Auth-specific props
interface AuthHeaderProps extends BaseHeaderProps {
  variant?: 'auth';
}

// Dashboard/Default props
interface DashboardHeaderProps extends BaseHeaderProps {
  variant?: 'dashboard' | 'default';
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  notificationCount?: number;
}

// Client-specific props
interface ClientHeaderProps extends BaseHeaderProps {
  variant?: 'client';
  onNotificationPress?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSites?: () => void;
  onNavigateToGuards?: () => void;
  onNavigateToReports?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSupport?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  notificationCount?: number;
  profileDrawer?: React.ReactNode; // Optional custom drawer component
}

// Guard-specific props
interface GuardHeaderProps extends BaseHeaderProps {
  variant?: 'guard';
  onNotificationPress?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToPastJobs?: () => void;
  onNavigateToAssignedSites?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSupport?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  notificationCount?: number;
  isActive?: boolean;
  profileDrawer?: React.ReactNode;
}

// Admin-specific props
interface AdminHeaderProps extends BaseHeaderProps {
  variant?: 'admin';
  welcomeText?: string;
  adminName?: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  onEmergencyPress?: () => void;
  onSettingsPress?: () => void;
  emergencyAlertCount?: number;
  notificationCount?: number;
}

// Union type for all header props
export type SharedHeaderProps =
  | AuthHeaderProps
  | DashboardHeaderProps
  | ClientHeaderProps
  | GuardHeaderProps
  | AdminHeaderProps;

export const SharedHeader: React.FC<SharedHeaderProps> = (props) => {
  const variant = props.variant || 'default';
  const { user } = useSelector((state: RootState) => state.auth);

  // Render based on variant
  switch (variant) {
    case 'auth':
      return <AuthHeaderComponent {...(props as AuthHeaderProps)} />;
    case 'client':
      return <ClientHeaderComponent {...(props as ClientHeaderProps)} />;
    case 'guard':
      return <GuardHeaderComponent {...(props as GuardHeaderProps)} />;
    case 'admin':
      return <AdminHeaderComponent {...(props as AdminHeaderProps)} />;
    case 'dashboard':
    case 'default':
    default:
      return <DashboardHeaderComponent {...(props as DashboardHeaderProps)} />;
  }
};

// Auth Header Component
const AuthHeaderComponent: React.FC<AuthHeaderProps> = ({ title, subtitle, style }) => {
  return (
    <View style={[sharedStyles.authContainer, style]}>
      <View style={sharedStyles.logoContainer}>
        <Image source={Logo} style={sharedStyles.authLogoImage as ImageStyle} resizeMode="contain" />
      </View>
      {title && (
        <View style={sharedStyles.titleContainer}>
          <Text style={sharedStyles.authTitle}>{title}</Text>
          {subtitle && <Text style={sharedStyles.authSubtitle}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
};

// Dashboard Header Component
const DashboardHeaderComponent: React.FC<DashboardHeaderProps> = ({
  title,
  showLogo = false,
  onMenuPress,
  onNotificationPress,
  leftIcon,
  rightIcon,
  notificationCount,
  style,
}) => {
  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    if (onMenuPress) {
      return (
        <TouchableOpacity style={sharedStyles.iconButton} onPress={onMenuPress}>
          <MenuIcon size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      );
    }
    return <View style={sharedStyles.iconButton} />;
  };

  const renderCenter = () => {
    if (showLogo) {
      return (
        <View style={sharedStyles.logoContainer}>
          <Image source={Logo} style={sharedStyles.logoImage as ImageStyle} resizeMode="contain" />
        </View>
      );
    }
    if (title) {
      return <Text style={sharedStyles.title}>{title}</Text>;
    }
    return null;
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    if (onNotificationPress) {
      return (
        <TouchableOpacity style={sharedStyles.iconButton} onPress={onNotificationPress}>
          <NotificationIcon size={24} color={COLORS.textPrimary} />
          {notificationCount !== undefined && notificationCount > 0 && (
            <View style={sharedStyles.notificationBadge}>
              <Text style={sharedStyles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    return <View style={sharedStyles.iconButton} />;
  };

  return (
    <View style={[sharedStyles.dashboardContainer, style]}>
      {renderLeft()}
      {renderCenter()}
      {renderRight()}
    </View>
  );
};

// Client Header Component
const ClientHeaderComponent: React.FC<ClientHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  leftIcon,
  rightIcon,
  notificationCount,
  profileDrawer,
  style,
  onNavigateToProfile,
  onNavigateToSites,
  onNavigateToGuards,
  onNavigateToReports,
  onNavigateToAnalytics,
  onNavigateToNotifications,
  onNavigateToSupport,
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    return (
      <TouchableOpacity style={sharedStyles.iconButton} onPress={openDrawer}>
        <MenuIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderCenter = () => {
    if (showLogo) {
      return (
        <View style={sharedStyles.logoContainer}>
          <Image source={Logo} style={sharedStyles.logoImage as ImageStyle} resizeMode="contain" />
        </View>
      );
    }
    if (title) {
      return <Text style={sharedStyles.title}>{title}</Text>;
    }
    return null;
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    return (
      <View style={sharedStyles.rightContainer}>
        {onNotificationPress && (
          <TouchableOpacity style={sharedStyles.iconButton} onPress={onNotificationPress}>
            <NotificationIcon size={24} color={COLORS.textPrimary} />
            {notificationCount !== undefined && notificationCount > 0 && (
              <View style={sharedStyles.notificationBadge}>
                <Text style={sharedStyles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, style]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
      {profileDrawer}
    </>
  );
};

// Guard Header Component
const GuardHeaderComponent: React.FC<GuardHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  leftIcon,
  rightIcon,
  notificationCount,
  isActive = false,
  profileDrawer,
  style,
  ...drawerProps
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    return (
      <TouchableOpacity style={sharedStyles.iconButton} onPress={openDrawer}>
        <MenuIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderCenter = () => {
    if (showLogo) {
      return (
        <View style={sharedStyles.logoContainer}>
          <Image source={Logo} style={sharedStyles.logoImage as ImageStyle} resizeMode="contain" />
        </View>
      );
    }
    if (title) {
      return <Text style={sharedStyles.title}>{title}</Text>;
    }
    return null;
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    return (
      <View style={sharedStyles.rightContainer}>
        {onNotificationPress && (
          <TouchableOpacity style={sharedStyles.iconButton} onPress={onNotificationPress}>
            <NotificationIcon size={24} color={COLORS.textPrimary} />
            {notificationCount !== undefined && notificationCount > 0 && (
              <View style={sharedStyles.notificationBadge}>
                <Text style={sharedStyles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, style]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
      {profileDrawer}
    </>
  );
};

// Admin Header Component
const AdminHeaderComponent: React.FC<AdminHeaderProps> = ({
  welcomeText,
  adminName,
  onMenuPress,
  onNotificationPress,
  onEmergencyPress,
  onSettingsPress,
  emergencyAlertCount = 0,
  notificationCount = 0,
  style,
}) => {
  const renderLeft = () => (
    <View style={sharedStyles.adminLeftContainer}>
      {onMenuPress && (
        <TouchableOpacity style={sharedStyles.iconButton} onPress={onMenuPress}>
          <MenuIcon size={24} color="#FFF" />
        </TouchableOpacity>
      )}
      <View style={sharedStyles.headerInfo}>
        {welcomeText && <Text style={sharedStyles.welcomeText}>{welcomeText}</Text>}
        {adminName && <Text style={sharedStyles.adminName}>{adminName}</Text>}
      </View>
    </View>
  );

  const renderRight = () => (
    <View style={sharedStyles.rightContainer}>
      {onNotificationPress && (
        <TouchableOpacity style={sharedStyles.iconButton} onPress={onNotificationPress}>
          <NotificationIcon size={24} color="#FFF" />
          {notificationCount > 0 && (
            <View style={sharedStyles.notificationBadge}>
              <Text style={sharedStyles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      {onEmergencyPress && (
        <TouchableOpacity style={sharedStyles.iconButton} onPress={onEmergencyPress}>
          <EmergencyIcon size={20} color="#FFF" />
          {emergencyAlertCount > 0 && (
            <View style={sharedStyles.notificationBadge}>
              <Text style={sharedStyles.badgeText}>{emergencyAlertCount > 99 ? '99+' : emergencyAlertCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      {onSettingsPress && (
        <TouchableOpacity style={sharedStyles.iconButton} onPress={onSettingsPress}>
          <SettingsIcon size={20} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[sharedStyles.adminContainer, style]}>
      {renderLeft()}
      {renderRight()}
    </View>
  );
};

// Shared Styles
const sharedStyles = StyleSheet.create({
  // Auth Styles
  authContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxxxl,
  },
  authLogoImage: {
    width: 160,
    height: 140,
  },
  authTitle: {
    fontFamily: TYPOGRAPHY.fontSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: 1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  authSubtitle: {
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxxxl,
  },

  // Dashboard/Default Styles
  dashboardContainer: {
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
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 73,
    height: 64,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#FFFFFF',
  },

  // Admin Styles
  adminContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    minHeight: 60,
    marginTop: 20,
  },
  adminLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: SPACING.md,
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  adminName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#FFFFFF',
  },
});

export default SharedHeader;

