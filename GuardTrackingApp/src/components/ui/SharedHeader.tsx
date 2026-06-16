import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ViewStyle, ImageStyle, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { NotificationIcon } from './AppIcons';
import { MenuIcon, ArrowLeftIcon } from './FeatherIcons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';
import { authStyles } from '../../styles/authStyles';
import Logo from '../../assets/images/tracSOpro-logo.png';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import ClientProfileDrawer from '../client/ClientProfileDrawer';
import GuardProfileDrawer from '../guard/GuardProfileDrawer';
import AdminProfileDrawer from '../admin/AdminProfileDrawer';
import SuperAdminProfileDrawer from '../superAdmin/SuperAdminProfileDrawer';

function useEffectiveNotificationCount(explicit?: number): number {
  const reduxCount = useSelector((state: RootState) => state.notifications.unreadCount);
  return explicit !== undefined ? explicit : Math.max(0, reduxCount);
}

function useHeaderTopPadding(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);
}

function useHeaderBell(explicitCount?: number, explicitPress?: () => void) {
  const bell = useNotificationBell({ refreshOnFocus: false });
  return {
    onNotificationPress: explicitPress ?? bell.onNotificationPress,
    badgeCount: useEffectiveNotificationCount(
      explicitCount !== undefined ? explicitCount : bell.notificationCount,
    ),
  };
}

function cloneProfileDrawer(
  drawer: React.ReactNode,
  visible: boolean,
  onClose: () => void,
): React.ReactNode {
  if (!drawer) return null;
  if (React.isValidElement(drawer)) {
    return React.cloneElement(drawer as React.ReactElement<any>, {
      visible,
      onClose,
    });
  }
  return drawer;
}

/** When the screen passes both profileDrawer and onMenuPress, it owns drawer visibility. */
function renderProfileDrawer(
  profileDrawer: React.ReactNode | undefined,
  defaultDrawer: React.ReactNode,
  isDrawerVisible: boolean,
  closeDrawer: () => void,
  screenOwnsDrawer: boolean,
  hideProfileDrawer?: boolean,
): React.ReactNode {
  if (hideProfileDrawer) return null;
  if (profileDrawer) {
    return screenOwnsDrawer
      ? profileDrawer
      : cloneProfileDrawer(profileDrawer, isDrawerVisible, closeDrawer);
  }
  return cloneProfileDrawer(defaultDrawer, isDrawerVisible, closeDrawer);
}

function renderHeaderLogo(showLogo: boolean, title?: string) {
  return (
    <View style={sharedStyles.centerSlot}>
      {showLogo ? (
        <View style={sharedStyles.logoContainer}>
          <Image source={Logo} style={sharedStyles.logoImage as ImageStyle} resizeMode="contain" />
        </View>
      ) : title ? (
        <Text style={sharedStyles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

function renderNotificationButton(onPress: () => void, badgeCount: number) {
  return (
    <TouchableOpacity style={sharedStyles.iconButton} onPress={onPress} activeOpacity={0.85}>
      <NotificationIcon size={24} color={COLORS.textPrimary} />
      {badgeCount > 0 && (
        <View style={sharedStyles.notificationBadge}>
          <Text style={sharedStyles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

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
  hideProfileDrawer?: boolean;
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
  onBackPress?: () => void;
  showBackButton?: boolean;
  hideLeftAction?: boolean;
  hideProfileDrawer?: boolean;
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
      <View style={authStyles.logoContainer}>
        <Image source={Logo} style={authStyles.logoImage as ImageStyle} resizeMode="contain" />
      </View>
      {title && (
        <View style={authStyles.headingBlock}>
          <Text style={authStyles.title}>{title}</Text>
          {subtitle && <Text style={authStyles.subtitle}>{subtitle}</Text>}
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
  const topPadding = useHeaderTopPadding();
  const { onNotificationPress: handleNotificationPress, badgeCount } = useHeaderBell(
    notificationCount,
    onNotificationPress,
  );

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    if (onMenuPress) {
      return (
        <TouchableOpacity style={sharedStyles.iconButton} onPress={onMenuPress} activeOpacity={0.85}>
          <MenuIcon size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      );
    }
    return <View style={sharedStyles.iconButton} />;
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    return renderNotificationButton(handleNotificationPress, badgeCount);
  };

  return (
    <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
      {renderLeft()}
      {renderHeaderLogo(showLogo, title)}
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
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const topPadding = useHeaderTopPadding();
  const { onNotificationPress: handleNotificationPress, badgeCount } = useHeaderBell(
    notificationCount,
    onNotificationPress,
  );

  const drawerNode = profileDrawer ?? <ClientProfileDrawer visible={false} onClose={closeDrawer} />;

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    return (
      <TouchableOpacity style={sharedStyles.iconButton} onPress={openDrawer} activeOpacity={0.85}>
        <MenuIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    return (
      <View style={sharedStyles.rightContainer}>
        {renderNotificationButton(handleNotificationPress, badgeCount)}
      </View>
    );
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
        {renderLeft()}
        {renderHeaderLogo(showLogo, title)}
        {renderRight()}
      </View>
      {cloneProfileDrawer(drawerNode, isDrawerVisible, closeDrawer)}
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
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const topPadding = useHeaderTopPadding();
  const { onNotificationPress: handleNotificationPress, badgeCount } = useHeaderBell(
    notificationCount,
    onNotificationPress,
  );

  const drawerNode = profileDrawer ?? <GuardProfileDrawer visible={false} onClose={closeDrawer} />;

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    return (
      <TouchableOpacity style={sharedStyles.iconButton} onPress={openDrawer} activeOpacity={0.85}>
        <MenuIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    return (
      <View style={sharedStyles.rightContainer}>
        {renderNotificationButton(handleNotificationPress, badgeCount)}
      </View>
    );
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
        {renderLeft()}
        {renderHeaderLogo(showLogo, title)}
        {renderRight()}
      </View>
      {cloneProfileDrawer(drawerNode, isDrawerVisible, closeDrawer)}
    </>
  );
};

// Admin Header Component
const AdminHeaderComponent: React.FC<AdminHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  onMenuPress,
  hideProfileDrawer,
  leftIcon,
  rightIcon,
  notificationCount,
  profileDrawer,
  style,
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const topPadding = useHeaderTopPadding();
  const { onNotificationPress: handleNotificationPress, badgeCount } = useHeaderBell(
    notificationCount,
    onNotificationPress,
  );

  const screenOwnsDrawer = Boolean(profileDrawer && onMenuPress);
  const handleMenuPress = onMenuPress ?? openDrawer;

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    return (
      <TouchableOpacity style={sharedStyles.iconButton} onPress={handleMenuPress} activeOpacity={0.85}>
        <MenuIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    return (
      <View style={sharedStyles.rightContainer}>
        {renderNotificationButton(handleNotificationPress, badgeCount)}
      </View>
    );
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
        {renderLeft()}
        {renderHeaderLogo(showLogo, title)}
        {renderRight()}
      </View>
      {renderProfileDrawer(
        profileDrawer,
        <AdminProfileDrawer visible={false} onClose={closeDrawer} />,
        isDrawerVisible,
        closeDrawer,
        screenOwnsDrawer,
        hideProfileDrawer,
      )}
    </>
  );
};

// Super Admin Header Component
const SuperAdminHeaderComponent: React.FC<SuperAdminHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  onMenuPress,
  onBackPress,
  showBackButton = false,
  hideLeftAction = false,
  hideProfileDrawer,
  leftIcon,
  rightIcon,
  notificationCount,
  profileDrawer,
  style,
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const topPadding = useHeaderTopPadding();
  const { onNotificationPress: handleNotificationPress, badgeCount } = useHeaderBell(
    notificationCount,
    onNotificationPress,
  );

  const screenOwnsDrawer = Boolean(profileDrawer && onMenuPress);
  const handleMenuPress = onMenuPress ?? openDrawer;

  const renderLeft = () => {
    if (leftIcon) return leftIcon;
    if (hideLeftAction) {
      return <View style={sharedStyles.iconButtonSpacer} />;
    }
    if (showBackButton) {
      return (
        <TouchableOpacity
          style={sharedStyles.iconButton}
          onPress={onBackPress}
          activeOpacity={0.85}
          disabled={!onBackPress}
        >
          <ArrowLeftIcon size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity style={sharedStyles.iconButton} onPress={handleMenuPress} activeOpacity={0.85}>
        <MenuIcon size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
    );
  };

  const renderRight = () => {
    if (rightIcon) return rightIcon;
    return (
      <View style={sharedStyles.rightContainer}>
        {renderNotificationButton(handleNotificationPress, badgeCount)}
      </View>
    );
  };

  return (
    <>
      <View style={[sharedStyles.dashboardContainer, { paddingTop: topPadding }, style]}>
        {renderLeft()}
        {renderHeaderLogo(showLogo, title)}
        {renderRight()}
      </View>
      {renderProfileDrawer(
        profileDrawer,
        <SuperAdminProfileDrawer visible={false} onClose={closeDrawer} />,
        isDrawerVisible,
        closeDrawer,
        screenOwnsDrawer,
        hideProfileDrawer,
      )}
    </>
  );
};

// Shared Styles
const sharedStyles = StyleSheet.create({
  // Auth Styles
  authContainer: {
    alignItems: 'center',
  },

  // Dashboard/Default Styles
  dashboardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
    minHeight: 56,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
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
  iconButtonSpacer: {
    width: 40,
    height: 40,
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

