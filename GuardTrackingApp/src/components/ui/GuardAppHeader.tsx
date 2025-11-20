import React from 'react';
import { ViewStyle } from 'react-native';
import SharedHeader from './SharedHeader';
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
  onNavigateToEarnings?: () => void;
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
  onNavigateToEarnings,
  onNavigateToNotifications,
  onNavigateToSupport,
  leftIcon,
  rightIcon,
  style,
  notificationCount = 3,
  isActive = true,
}) => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();

  return (
    <>
      <SharedHeader
        variant="guard"
        title={title}
        showLogo={showLogo}
        onNotificationPress={onNotificationPress}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        style={style}
        notificationCount={notificationCount}
        isActive={isActive}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPastJobs={onNavigateToPastJobs}
        onNavigateToAssignedSites={onNavigateToAssignedSites}
        onNavigateToAttendance={onNavigateToAttendance}
        onNavigateToNotifications={onNavigateToNotifications}
        onNavigateToSupport={onNavigateToSupport}
        profileDrawer={
          <GuardProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToProfile={onNavigateToProfile}
            onNavigateToPastJobs={onNavigateToPastJobs}
            onNavigateToAssignedSites={onNavigateToAssignedSites}
            onNavigateToAttendance={onNavigateToAttendance}
            onNavigateToEarnings={onNavigateToEarnings}
            onNavigateToNotifications={onNavigateToNotifications}
            onNavigateToSupport={onNavigateToSupport}
          />
        }
      />
    </>
  );
};

export default GuardAppHeader;
