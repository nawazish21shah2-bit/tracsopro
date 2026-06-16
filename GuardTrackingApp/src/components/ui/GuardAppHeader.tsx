import React from 'react';
import { ViewStyle } from 'react-native';
import SharedHeader from './SharedHeader';
import GuardProfileDrawer from '../guard/GuardProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';

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
  notificationCount?: number;
  isActive?: boolean;
}

/**
 * GuardAppHeader - Guard-specific header component
 * Wraps SharedHeader with guard variant and profile drawer integration
 */
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
  notificationCount,
  isActive = true,
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const bell = useNotificationBell();

  return (
    <>
      <SharedHeader
        variant="guard"
        title={title}
        showLogo={showLogo}
        onNotificationPress={onNotificationPress ?? bell.onNotificationPress}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        style={style}
        notificationCount={notificationCount ?? bell.notificationCount}
        isActive={isActive}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPastJobs={onNavigateToPastJobs}
        onNavigateToAssignedSites={onNavigateToAssignedSites}
        onNavigateToAttendance={onNavigateToAttendance}
        onNavigateToNotifications={onNavigateToNotifications ?? bell.onNotificationPress}
        onNavigateToSupport={onNavigateToSupport}
        profileDrawer={
          <GuardProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToPastJobs={onNavigateToPastJobs}
            onNavigateToAssignedSites={onNavigateToAssignedSites}
            onNavigateToAttendance={onNavigateToAttendance}
            onNavigateToNotifications={onNavigateToNotifications ?? bell.onNotificationPress}
            onNavigateToSupport={onNavigateToSupport}
          />
        }
      />
    </>
  );
};

export default GuardAppHeader;
