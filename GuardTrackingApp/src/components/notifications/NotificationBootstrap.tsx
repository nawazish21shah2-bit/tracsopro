import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  clearNotifications,
  fetchUnreadCount,
  addNotification,
} from '../../store/slices/notificationSlice';
import { NotificationType } from '../../types';
import { displayRemoteMessage } from '../../utils/displayPushNotification';

/**
 * Keeps notification unread count in sync app-wide:
 * - initial fetch after login
 * - refresh when app returns to foreground
 * - increment on foreground FCM messages
 * - clear on logout
 */
const NotificationBootstrap: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(clearNotifications());
      return;
    }

    dispatch(fetchUnreadCount());

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        dispatch(fetchUnreadCount());
      }
      appState.current = nextState;
    });

    let unsubscribeForeground: (() => void) | undefined;

    try {
      const messaging = require('@react-native-firebase/messaging').default;
      unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
        const { notification, data } = remoteMessage || {};

        // FCM does not show the system tray while the app is in foreground — display locally
        displayRemoteMessage(remoteMessage);

        dispatch(
          addNotification({
            id: data?.notificationId || `push_${Date.now()}`,
            userId: data?.userId || 'system',
            title: notification?.title || data?.title || 'Notification',
            message: notification?.body || data?.body || '',
            type: (data?.type as NotificationType) || NotificationType.SYSTEM,
            data: data || {},
            isRead: false,
            createdAt: new Date(),
          })
        );
        dispatch(fetchUnreadCount());
      });
    } catch {
      // Firebase not linked in this build — in-app notifications still work
    }

    return () => {
      subscription.remove();
      unsubscribeForeground?.();
    };
  }, [dispatch, isAuthenticated]);

  return null;
};

export default NotificationBootstrap;
