// Enhanced Push Notification Service - Phase 3
import { Platform, Alert, Linking, AppState, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { addNotification, updateNotification } from '../store/slices/notificationSlice';
import { ErrorHandler } from '../utils/errorHandler';

class NotificationService {
  private isInitialized = false;
  private sessionListenersAttached = false;
  private shiftReminders: Map<string, number> = new Map();

  /**
   * Lightweight push setup on every login — channel, permissions, token registration,
   * and open-app handlers. Safe to call multiple times.
   */
  async setupPushOnLogin(): Promise<void> {
    try {
      this.ensureAndroidChannel();
      const enabled = await this.requestPermissions();
      if (!enabled && Platform.OS === 'ios') {
        console.warn('[Push] iOS notification permission not granted');
        return;
      }

      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await AsyncStorage.setItem('fcmToken', fcmToken);
        await this.sendTokenToServer(fcmToken);
        console.log('[Push] Device token registered with backend');
      } else {
        console.warn('[Push] FCM returned no token — check google-services.json and Firebase project');
      }

      this.attachSessionListeners();
    } catch (error) {
      ErrorHandler.handleError(error, 'push_setup_on_login');
    }
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.setupPushOnLogin();
      await this.setupPushNotifications();
      await this.setupShiftReminders();
      this.isInitialized = true;
    } catch (error) {
      ErrorHandler.handleError(error, 'notification_initialization');
    }
  }

  private ensureAndroidChannel(): void {
    if (Platform.OS !== 'android') return;

    PushNotification.createChannel(
      {
        channelId: 'default',
        channelName: 'Notifications',
        channelDescription: 'Shift updates, alerts, and messages',
        importance: 4,
        vibrate: true,
      },
      (created) => {
        if (__DEV__) console.log(`Android notification channel ${created ? 'created' : 'exists'}`);
      }
    );
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        console.warn(
          'POST_NOTIFICATIONS not granted — enable notifications in system settings to see alerts in the tray'
        );
        // Still continue: register FCM token so pushes work once permission is granted
      }
    }

    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  private attachSessionListeners(): void {
    if (this.sessionListenersAttached) return;
    this.sessionListenersAttached = true;

    messaging().onTokenRefresh(async (newToken: string) => {
      await AsyncStorage.setItem('fcmToken', newToken);
      await this.sendTokenToServer(newToken);
    });

    messaging().onNotificationOpenedApp((remoteMessage) => {
      this.handleNotificationOpened(remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then((initialNotification) => {
        if (initialNotification) {
          this.handleNotificationOpened(initialNotification);
        }
      })
      .catch(() => {});
  }

  /**
   * Show permission request alert
   */
  private showPermissionAlert() {
    Alert.alert(
      'Notifications Disabled',
      'Enable notifications to receive shift reminders and important updates.',
      [
        { text: 'Later', style: 'cancel' },
        { 
          text: 'Settings', 
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  }

  private async setupPushNotifications() {
    // Token registration handled by setupPushOnLogin; configure local notification UI
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Local notification token:', token);
      },
      onNotification: (notification) => {
        console.log('Local notification received:', notification);
        this.handleLocalNotification(notification);
      },
      onAction: (notification) => {
        console.log('Notification action:', notification);
        this.handleNotificationAction(notification);
      },
      onRegistrationError: (error) => {
        console.error('Notification registration error:', error);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }

  private async sendTokenToServer(token: string) {
    try {
      const apiService = (await import('./api')).default;
      const deviceId = await this.getDeviceId();

      const response = await apiService.registerDeviceToken(token, Platform.OS, deviceId);

      if (response.success) {
        console.log('Device token registered successfully');
      } else {
        console.error('Failed to register device token:', response.message);
      }
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      if (deviceId) return deviceId;
      
      // Generate device ID if not exists
      const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('deviceId', newDeviceId);
      return newDeviceId;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Add notification to Redux store (consolidated)
   */
  private addToStore(notification: {
    id?: string;
    userId?: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }) {
    store.dispatch(addNotification({
      id: notification.id || Date.now().toString(),
      userId: notification.userId || 'system',
      title: notification.title,
      message: notification.message,
      type: notification.type || 'system',
      data: notification.data,
      isRead: false,
      createdAt: new Date(),
    }));
  }

  private handleLocalNotification(notification: any) {
    const { data, message } = notification;
    
    this.addToStore({
      title: message || 'Notification',
      message: data?.body || '',
      type: data?.type || 'system',
      data,
      userId: data?.userId,
    });

    // Show alert for important notifications
    if (data?.priority === 'high' || data?.type === 'emergency') {
      Alert.alert(
        message || 'Notification',
        data?.body || '',
        [
          { text: 'OK' },
          { text: 'View', onPress: () => this.handleNotificationAction(notification) },
        ]
      );
    }
  }

  private handleBackgroundMessage(remoteMessage: any) {
    const { data, notification } = remoteMessage;
    
    this.addToStore({
      title: notification?.title || 'Background Notification',
      message: notification?.body || data?.body || '',
      type: data?.type || 'system',
      data,
      userId: data?.userId,
    });
    
    // Record delivered event to backend analytics
    (async () => {
      try {
        const apiService = (await import('./api')).default;
        await apiService.recordNotificationEvent({
          notificationId: data?.notificationId,
          eventType: 'DELIVERED',
          notificationType: data?.type,
        });
      } catch (err) {
        console.error('Failed to record delivered notification event:', err);
      }
    })();
  }

  private handleNotificationOpened(remoteMessage: any) {
    const { data, notification: notificationPayload } = remoteMessage || {};
    const parsedData = this.parsePushData(data);

    this.navigateFromNotificationData(parsedData, notificationPayload?.title);

    (async () => {
      try {
        const apiService = (await import('./api')).default;

        if (parsedData.notificationId) {
          const notificationId = String(parsedData.notificationId);
          await apiService.markNotificationAsRead(notificationId);
          store.dispatch(
            updateNotification({ id: notificationId, notification: { isRead: true } })
          );
        }

        await apiService.recordNotificationEvent({
          notificationId: parsedData.notificationId as string | undefined,
          eventType: 'OPENED',
          notificationType: parsedData.type as string | undefined,
        });
      } catch (err) {
        console.error('Failed to handle opened notification:', err);
      }
    })();
  }

  private parsePushData(data: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!data) return {};

    const parsed: Record<string, unknown> = { ...data };
    if (typeof parsed.params === 'string') {
      try {
        parsed.params = JSON.parse(parsed.params);
      } catch {
        // keep raw string
      }
    }
    return parsed;
  }

  private navigateFromNotificationData(
    data: Record<string, unknown>,
    fallbackTitle?: string
  ): void {
    if (data.screen) {
      this.navigateToScreen(String(data.screen), data.params);
      return;
    }

    if (data.shiftId) {
      this.navigateToScreen('ShiftDetails', { shiftId: data.shiftId });
    } else if (data.incidentId || data.reportId) {
      this.navigateToScreen('IncidentDetail', {
        incidentId: data.incidentId || data.reportId,
      });
    } else if (data.alertId || data.type === 'emergency') {
      this.navigateToScreen('EmergencyAlertResponse', {
        alertId: data.alertId,
      });
    } else if (data.ticketId) {
      this.navigateToSupportTicket(String(data.ticketId));
    } else if (data.conversationId || data.chatId) {
      this.navigateToScreen('IndividualChatScreen', {
        chatId: data.conversationId || data.chatId,
        chatName: fallbackTitle || 'Chat',
      });
    }
  }

  private handleNotificationAction(notification: any) {
    const { data } = notification;
    
    if (data?.url) {
      Linking.openURL(data.url);
    } else if (data?.screen) {
      this.navigateToScreen(data.screen, data.params);
    }
  }

  private navigateToSupportTicket(ticketId: string): void {
    const role = store.getState().auth.user?.role;
    if (role === 'ADMIN') {
      this.navigateToScreen('AdminTabs', {
        screen: 'Settings',
        params: {
          screen: 'SupportTicketDetailScreen',
          params: { ticketId, variant: 'admin', mode: 'inbox' },
        },
      });
    } else if (role === 'SUPER_ADMIN') {
      this.navigateToScreen('SuperAdminTabs', {
        screen: 'Settings',
        params: {
          screen: 'SupportTicketDetailScreen',
          params: { ticketId, variant: 'superAdmin', mode: 'platform' },
        },
      });
    } else if (role === 'CLIENT') {
      this.navigateToScreen('ClientTabs', {
        screen: 'Settings',
        params: {
          screen: 'SupportTicketDetailScreen',
          params: { ticketId, variant: 'client', mode: 'mine' },
        },
      });
    } else if (role === 'GUARD') {
      this.navigateToScreen('GuardTabs', {
        screen: 'Settings',
        params: {
          screen: 'SupportTicketDetailScreen',
          params: { ticketId, variant: 'guard', mode: 'mine' },
        },
      });
    } else {
      this.navigateToScreen('SupportTicketDetailScreen', { ticketId });
    }
  }

  private navigateToScreen(screen: string, params?: any) {
    try {
      const { navigationRef } = require('../navigation/AppNavigator');
      if (!navigationRef.current) {
        setTimeout(() => this.navigateToScreen(screen, params), 500);
        return;
      }

      if (navigationRef.current.isReady()) {
        navigationRef.current.navigate(screen as never, params as never);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  /**
   * Send local notification (main method)
   */
  sendLocalNotification(title: string, message: string, data?: any) {
    PushNotification.localNotification({
      channelId: 'default',
      title,
      message,
      userInfo: data,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      ...(Platform.OS === 'android' ? { smallIcon: 'ic_launcher' } : {}),
    });

    // Also add to store for consistency
    this.addToStore({ title, message, type: data?.type, data });
  }

  // Send scheduled notification
  sendScheduledNotification(title: string, message: string, date: Date, data?: any) {
    PushNotification.localNotificationSchedule({
      title,
      message,
      date,
      data,
      playSound: true,
      soundName: 'default',
    });
  }

  // Cancel notification
  cancelNotification(id: string) {
    PushNotification.cancelLocalNotifications({ id });
  }

  // Cancel all notifications
  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }


  // Get notification settings (syncs with backend - use backend as source of truth)
  async getNotificationSettings() {
    try {
      // Backend settings are source of truth, but cache locally for offline access
      const cached = await AsyncStorage.getItem('notificationSettings');
      const defaultSettings = {
        pushNotifications: true,
        emailNotifications: false,
        smsNotifications: false,
        emergencyAlerts: true,
        shiftReminders: true,
        incidentAlerts: true,
        messageNotifications: true,
      };
      return cached ? JSON.parse(cached) : defaultSettings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {};
    }
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
    } catch (error) {
      ErrorHandler.handleError(error, 'request_notification_permission');
      return false;
    }
  }

  /**
   * Setup shift reminders
   */
  private async setupShiftReminders() {
    try {
      // Clear existing reminders
      this.clearAllShiftReminders();
      
      // Load upcoming shifts and set reminders
      // This would typically fetch from your shift service
      // For now, we'll set up the infrastructure
    } catch (error) {
      ErrorHandler.handleError(error, 'setup_shift_reminders', false);
    }
  }

  /**
   * Schedule shift reminder notifications
   */
  async scheduleShiftReminder(shift: {
    id: string;
    startTime: string;
    locationName: string;
    address: string;
  }) {
    try {
      const settings = await this.getNotificationSettings();
      if (!settings.shiftReminders) return;

      const shiftTime = new Date(shift.startTime);
      const now = new Date();

      // Schedule reminders at different intervals
      const reminderTimes = [
        { minutes: 60, message: '1 hour before shift' },
        { minutes: 30, message: '30 minutes before shift' },
        { minutes: 15, message: '15 minutes before shift' },
      ];

      reminderTimes.forEach(({ minutes, message }) => {
        const reminderTime = new Date(shiftTime.getTime() - (minutes * 60 * 1000));
        
        if (reminderTime > now) {
          const notificationId = this.generateNotificationId(shift.id, minutes);
          
          PushNotification.localNotificationSchedule({
            id: notificationId,
            title: 'Shift Reminder',
            message: `${message} at ${shift.locationName}`,
            date: reminderTime,
            soundName: 'default',
            userInfo: {
              type: 'shift_reminder',
              shiftId: shift.id,
              minutes,
            },
          });

          this.shiftReminders.set(`${shift.id}_${minutes}`, notificationId);
        }
      });
    } catch (error) {
      ErrorHandler.handleError(error, 'schedule_shift_reminder', false);
    }
  }

  /**
   * Cancel shift reminders
   */
  async cancelShiftReminders(shiftId: string) {
    try {
      const reminderKeys = Array.from(this.shiftReminders.keys())
        .filter(key => key.startsWith(shiftId));

      reminderKeys.forEach(key => {
        const notificationId = this.shiftReminders.get(key);
        if (notificationId) {
          PushNotification.cancelLocalNotifications({ id: notificationId.toString() });
          this.shiftReminders.delete(key);
        }
      });
    } catch (error) {
      ErrorHandler.handleError(error, 'cancel_shift_reminders', false);
    }
  }

  /**
   * Clear all shift reminders
   */
  private clearAllShiftReminders() {
    try {
      this.shiftReminders.forEach(notificationId => {
        PushNotification.cancelLocalNotifications({ id: notificationId.toString() });
      });
      this.shiftReminders.clear();
    } catch (error) {
      ErrorHandler.handleError(error, 'clear_all_shift_reminders', false);
    }
  }

  /**
   * Send immediate notification
   */
  async sendImmediateNotification(title: string, message: string, data?: any) {
    try {
      PushNotification.localNotification({
        title,
        message,
        soundName: 'default',
        userInfo: data,
      });
    } catch (error) {
      ErrorHandler.handleError(error, 'send_immediate_notification', false);
    }
  }

  /**
   * Send emergency alert (consolidated method)
   */
  async sendEmergencyAlert(
    message: string,
    location?: { latitude: number; longitude: number },
    incidentId?: string
  ) {
    try {
      const settings = await this.getNotificationSettings();
      if (!settings.emergencyAlerts) return;

      // Send local notification
      this.sendLocalNotification('🚨 EMERGENCY ALERT', message, {
        type: 'emergency',
        priority: 'high',
        location,
        incidentId,
        timestamp: new Date().toISOString(),
      });

      // Show immediate alert for critical emergencies
      Alert.alert(
        '🚨 EMERGENCY ALERT',
        message + (location ? `\n\nLocation: ${location.latitude}, ${location.longitude}` : ''),
        [
          { text: 'Acknowledge', style: 'default' },
          {
            text: 'View Details',
            onPress: () => incidentId && this.navigateToScreen('IncidentDetail', { incidentId }),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'send_emergency_alert');
    }
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(shiftId: string, minutes: number): number {
    return parseInt(`${shiftId.slice(-4)}${minutes}`.replace(/\D/g, '')) || Math.floor(Math.random() * 10000);
  }
}

export default new NotificationService();
