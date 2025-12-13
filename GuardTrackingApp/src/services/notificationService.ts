// Enhanced Push Notification Service - Phase 3
import { Platform, Alert, Linking, AppState } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { addNotification } from '../store/slices/notificationSlice';
import { ErrorHandler } from '../utils/errorHandler';

class NotificationService {
  private isInitialized = false;
  private shiftReminders: Map<string, number> = new Map();

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
        await this.setupPushNotifications();
        await this.setupBackgroundHandlers();
        await this.setupShiftReminders();
        this.isInitialized = true;
      } else {
        console.log('Notification permission denied');
        this.showPermissionAlert();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'notification_initialization');
    }
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
    // Get FCM token
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log('FCM Token:', fcmToken);
      await AsyncStorage.setItem('fcmToken', fcmToken);
      
      // Send token to server
      await this.sendTokenToServer(fcmToken);
    }

    // Configure local notifications
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

  private async setupBackgroundHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
      this.handleBackgroundMessage(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      this.handleNotificationOpened(remoteMessage);
    });

    // Handle initial notification
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('Initial notification:', initialNotification);
      this.handleNotificationOpened(initialNotification);
    }
  }

  private async sendTokenToServer(token: string) {
    try {
      // Send FCM token to backend using API service
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

  private handleLocalNotification(notification: any) {
    const { data, message } = notification;
    
    // Add to Redux store
    store.dispatch(addNotification({
      id: Date.now().toString(),
      userId: data?.userId || 'system',
      title: message || 'Notification',
      message: data?.body || '',
      type: data?.type || 'system',
      data: data,
      isRead: false,
      createdAt: new Date(),
    }));

    // Show alert for important notifications
    if (data?.priority === 'high' || data?.type === 'emergency') {
      Alert.alert(
        message || 'Notification',
        data?.body || '',
        [
          { text: 'OK' },
          { text: 'View', onPress: () => this.handleNotificationAction(notification) }
        ]
      );
    }
  }

  private handleBackgroundMessage(remoteMessage: any) {
    const { data, notification } = remoteMessage;
    
    // Add to Redux store
    store.dispatch(addNotification({
      id: Date.now().toString(),
      userId: data?.userId || 'system',
      title: notification?.title || 'Background Notification',
      message: notification?.body || data?.body || '',
      type: data?.type || 'system',
      data: data,
      isRead: false,
      createdAt: new Date(),
    }));
  }

  private handleNotificationOpened(remoteMessage: any) {
    const { data } = remoteMessage;
    
    if (data?.screen) {
      // Navigate to specific screen
      this.navigateToScreen(data.screen, data.params);
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

  private navigateToScreen(screen: string, params?: any) {
    // In a real app, you'd use navigation service
    console.log('Navigate to screen:', screen, params);
  }

  // Send local notification
  sendLocalNotification(title: string, message: string, data?: any) {
    PushNotification.localNotification({
      title,
      message,
      data,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
    });
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

  // Send emergency alert
  sendEmergencyAlert(alert: {
    title: string;
    message: string;
    location?: string;
    guardId?: string;
    incidentId?: string;
  }) {
    const { title, message, location, guardId, incidentId } = alert;
    
    // Send local notification
    this.sendLocalNotification(title, message, {
      type: 'emergency',
      priority: 'high',
      location,
      guardId,
      incidentId,
    });

    // Show immediate alert
    Alert.alert(
      '🚨 EMERGENCY ALERT',
      `${title}\n\n${message}${location ? `\n\nLocation: ${location}` : ''}`,
      [
        { text: 'Acknowledge', style: 'default' },
        { text: 'View Details', onPress: () => this.navigateToScreen('IncidentDetail', { incidentId }) }
      ],
      { cancelable: false }
    );
  }

  // Send shift reminder
  sendShiftReminder(guardName: string, shiftTime: string, location: string) {
    this.sendLocalNotification(
      'Shift Reminder',
      `Hi ${guardName}, your shift starts at ${shiftTime} at ${location}`,
      {
        type: 'shift_reminder',
        guardName,
        shiftTime,
        location,
      }
    );
  }

  // Send incident alert
  sendIncidentAlert(incident: {
    id: string;
    type: string;
    severity: string;
    location: string;
    description: string;
  }) {
    const { id, type, severity, location, description } = incident;
    
    this.sendLocalNotification(
      `New ${severity.toUpperCase()} Incident`,
      `${type} at ${location}: ${description}`,
      {
        type: 'incident_alert',
        incidentId: id,
        severity,
        location,
      }
    );
  }

  // Send message notification
  sendMessageNotification(senderName: string, message: string, conversationId: string) {
    this.sendLocalNotification(
      `Message from ${senderName}`,
      message,
      {
        type: 'message',
        conversationId,
        senderName,
      }
    );
  }

  // Get notification settings
  async getNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      return settings ? JSON.parse(settings) : {
        pushNotifications: true,
        emailNotifications: false,
        smsNotifications: false,
        emergencyAlerts: true,
        shiftReminders: true,
        incidentAlerts: true,
        messageNotifications: true,
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {};
    }
  }

  // Update notification settings
  async updateNotificationSettings(settings: any) {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error updating notification settings:', error);
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
   * Send emergency alert
   */
  async sendEmergencyAlert(message: string, location?: { latitude: number; longitude: number }) {
    try {
      const settings = await this.getNotificationSettings();
      if (!settings.emergencyAlerts) return;

      PushNotification.localNotification({
        id: 'emergency_alert',
        title: '🚨 EMERGENCY ALERT',
        message,
        soundName: 'default',
        priority: 'max',
        importance: 'max',
        userInfo: {
          type: 'emergency_alert',
          location,
          timestamp: new Date().toISOString(),
        },
      });
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
