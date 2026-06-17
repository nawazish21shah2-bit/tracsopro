import { useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchUnreadCount } from '../store/slices/notificationSlice';
import { getNotificationsRouteForRole } from '../utils/notificationRoutes';

interface UseNotificationBellOptions {
  /** Override the default notifications list route for this stack. */
  notificationsRoute?: string;
  /** Refresh unread count when the screen gains focus (default: true). */
  refreshOnFocus?: boolean;
}

/**
 * Shared bell icon behaviour: unread badge count + navigate to notification list.
 */
export function useNotificationBell(options: UseNotificationBellOptions = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: RootState) => state.auth);
  const unreadCount = useSelector((state: RootState) => state.notifications.unreadCount);

  const notificationsRoute =
    options.notificationsRoute ?? getNotificationsRouteForRole(user?.role);

  const refreshUnreadCount = useCallback(async () => {
    try {
      await dispatch(fetchUnreadCount()).unwrap();
    } catch {
      // Non-fatal: badge may show stale count until next refresh
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (options.refreshOnFocus === false) return;
      refreshUnreadCount();
    }, [refreshUnreadCount, options.refreshOnFocus])
  );

  const onNotificationPress = useCallback(() => {
    if (!notificationsRoute) return;
    try {
      let navigator: any = navigation;
      while (navigator) {
        const routeNames: string[] = navigator.getState?.()?.routeNames ?? [];
        if (routeNames.includes(notificationsRoute)) {
          navigator.navigate(notificationsRoute);
          return;
        }
        navigator = navigator.getParent?.();
      }
      navigation.navigate(notificationsRoute);
    } catch (error) {
      if (__DEV__) console.warn('Failed to navigate to notifications:', error);
    }
  }, [navigation, notificationsRoute]);

  return {
    unreadCount: Math.max(0, unreadCount),
    notificationCount: Math.max(0, unreadCount),
    onNotificationPress,
    refreshUnreadCount,
  };
}
