import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ViewStyle, ImageStyle, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {  NotificationIcon, EmergencyIcon, SettingsIcon } from './AppIcons';
import { MenuIcon, BellIcon } from './FeatherIcons';

import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

// Header variant types
export type HeaderVariant = 'auth' | 'dashboard' | 'client' | 'guard' | 'admin' | 'superAdmin' | 'default';

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
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  notificationCount?: number;
  profileDrawer?: React.ReactNode;
}

// Super Admin-specific props
interface SuperAdminHeaderProps extends BaseHeaderProps {
  variant?: 'superAdmin';
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  notificationCount?: number;
  profileDrawer?: React.ReactNode;
}

// Union type for all header props
export type SharedHeaderProps =
  | AuthHeaderProps
  | DashboardHeaderProps
  | ClientHeaderProps
  | GuardHeaderProps
  | AdminHeaderProps
  | SuperAdminHeaderProps;

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
    case 'superAdmin':
      return <SuperAdminHeaderComponent {...(props as SuperAdminHeaderProps)} />;
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
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

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
    <View style={[sharedStyles.dashboardContainer,  style]}>
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
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

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

  // Clone profileDrawer to pass drawer state if it's a React element
  const renderProfileDrawer = () => {
    if (!profileDrawer) return null;
    
    // If profileDrawer is a React element, clone it and pass the drawer state
    if (React.isValidElement(profileDrawer)) {
      return React.cloneElement(profileDrawer as React.ReactElement<any>, {
        visible: isDrawerVisible,
        onClose: closeDrawer,
      });
    }
    
    return profileDrawer;
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
      {renderProfileDrawer()}
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
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

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

  // Clone profileDrawer to pass drawer state if it's a React element
  const renderProfileDrawer = () => {
    if (!profileDrawer) return null;
    
    // If profileDrawer is a React element, clone it and pass the drawer state
    if (React.isValidElement(profileDrawer)) {
      return React.cloneElement(profileDrawer as React.ReactElement<any>, {
        visible: isDrawerVisible,
        onClose: closeDrawer,
      });
    }
    
    return profileDrawer;
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
      {renderProfileDrawer()}
    </>
  );
};

// Admin Header Component
const AdminHeaderComponent: React.FC<AdminHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  onMenuPress,
  leftIcon,
  rightIcon,
  notificationCount,
  profileDrawer,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    return (
      <TouchableOpacity style={sharedStyles.iconButton} onPress={onMenuPress}>
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

  // Render profileDrawer as-is (props should be set by parent component)
  const renderProfileDrawer = () => {
    return profileDrawer || null;
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
      {renderProfileDrawer()}
    </>
  );
};

// Super Admin Header Component
const SuperAdminHeaderComponent: React.FC<SuperAdminHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  onMenuPress,
  leftIcon,
  rightIcon,
  notificationCount,
  profileDrawer,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    return (
      <TouchableOpacity style={sharedStyles.iconButton} onPress={onMenuPress}>
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

  // Render profileDrawer as-is (props should be set by parent component)
  const renderProfileDrawer = () => {
    return profileDrawer || null;
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
        {renderLeft()}
        {renderCenter()}
        {renderRight()}
      </View>
      {renderProfileDrawer()}
    </>
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
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    minHeight: 60,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 98,
    marginRight: SPACING.sm,
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
    width: 103,
    height: 84,
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

});

export default SharedHeader;

