import React from 'react';
import { ViewStyle } from 'react-native';
import SharedHeader from './SharedHeader';
import ClientProfileDrawer from '../client/ClientProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';

interface ClientAppHeaderProps {
  title?: string;
  showLogo?: boolean;
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
  style?: ViewStyle;
  notificationCount?: number;
}

/**
 * ClientAppHeader - Client-specific header component
 * Wraps SharedHeader with client variant and profile drawer integration
 */
export const ClientAppHeader: React.FC<ClientAppHeaderProps> = ({
  title,
  showLogo = false,
  onNotificationPress,
  onNavigateToProfile,
  onNavigateToSites,
  onNavigateToGuards,
  onNavigateToReports,
  onNavigateToAnalytics,
  onNavigateToNotifications,
  onNavigateToSupport,
  leftIcon,
  rightIcon,
  style,
  notificationCount,
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const bell = useNotificationBell({ notificationsRoute: 'ClientNotifications' });

  return (
    <>
      <SharedHeader
        variant="client"
        title={title}
        showLogo={showLogo}
        onNotificationPress={onNotificationPress ?? bell.onNotificationPress}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        style={style}
        notificationCount={notificationCount ?? bell.notificationCount}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToSites={onNavigateToSites}
        onNavigateToGuards={onNavigateToGuards}
        onNavigateToReports={onNavigateToReports}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onNavigateToNotifications={onNavigateToNotifications ?? bell.onNotificationPress}
        onNavigateToSupport={onNavigateToSupport}
        profileDrawer={
          <ClientProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToSites={onNavigateToSites}
            onNavigateToGuards={onNavigateToGuards}
            onNavigateToReports={onNavigateToReports}
            onNavigateToAnalytics={onNavigateToAnalytics}
            onNavigateToNotifications={onNavigateToNotifications ?? bell.onNotificationPress}
            onNavigateToSupport={onNavigateToSupport}
          />
        }
      />
    </>
  );
};

export default ClientAppHeader;
