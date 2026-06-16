import React from 'react';
import { HeaderVariant } from '../components/ui/SharedHeader';
import { useProfileDrawer } from './useProfileDrawer';
import { useNotificationBell } from './useNotificationBell';
import { getNotificationsRouteForRole } from '../utils/notificationRoutes';
import AdminProfileDrawer from '../components/admin/AdminProfileDrawer';
import SuperAdminProfileDrawer from '../components/superAdmin/SuperAdminProfileDrawer';
import ClientProfileDrawer from '../components/client/ClientProfileDrawer';
import GuardProfileDrawer from '../components/guard/GuardProfileDrawer';

export type RoleHeaderVariant = 'admin' | 'superAdmin' | 'client' | 'guard';

function roleToAuthRole(variant: RoleHeaderVariant): string {
  switch (variant) {
    case 'superAdmin':
      return 'SUPER_ADMIN';
    case 'admin':
      return 'ADMIN';
    case 'client':
      return 'CLIENT';
    case 'guard':
    default:
      return 'GUARD';
  }
}

function buildProfileDrawer(
  variant: RoleHeaderVariant,
  visible: boolean,
  onClose: () => void,
): React.ReactNode {
  switch (variant) {
    case 'admin':
      return <AdminProfileDrawer visible={visible} onClose={onClose} />;
    case 'superAdmin':
      return <SuperAdminProfileDrawer visible={visible} onClose={onClose} />;
    case 'client':
      return <ClientProfileDrawer visible={visible} onClose={onClose} />;
    case 'guard':
    default:
      return <GuardProfileDrawer visible={visible} onClose={onClose} />;
  }
}

/**
 * Consistent menu + notification header for role-based stack screens.
 */
export function useRoleScreenHeader(title: string, variant: RoleHeaderVariant = 'admin') {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: getNotificationsRouteForRole(roleToAuthRole(variant)),
  });

  const profileDrawer = buildProfileDrawer(variant, isDrawerVisible, closeDrawer);

  return {
    isDrawerVisible,
    openDrawer,
    closeDrawer,
    onNotificationPress,
    notificationCount,
    headerProps: {
      variant: variant as HeaderVariant,
      title,
      showLogo: false as const,
      onMenuPress: openDrawer,
      onNotificationPress,
      notificationCount,
      profileDrawer,
    },
  };
}
