import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

const DEFAULT_CHANNEL_ID = 'default';

let channelReady = false;

function ensureChannel(): void {
  if (channelReady || Platform.OS !== 'android') return;

  PushNotification.createChannel(
    {
      channelId: DEFAULT_CHANNEL_ID,
      channelName: 'Notifications',
      channelDescription: 'Shift updates, alerts, and messages',
      importance: 4,
      vibrate: true,
    },
    () => {}
  );
  channelReady = true;
}

/**
 * Show a notification in the Android/iOS system tray.
 * Required for foreground FCM messages (FCM does not auto-show tray while app is open).
 */
export function displayPushNotification(
  title: string,
  message: string,
  data?: Record<string, unknown>
): void {
  ensureChannel();

  PushNotification.localNotification({
    channelId: DEFAULT_CHANNEL_ID,
    title: title || 'Notification',
    message: message || '',
    userInfo: data,
    playSound: true,
    soundName: 'default',
    importance: 'high',
    priority: 'high',
    ...(Platform.OS === 'android' ? { smallIcon: 'ic_launcher' } : {}),
  });
}

/**
 * Handle an FCM remote message — show tray notification when appropriate.
 */
export function displayRemoteMessage(remoteMessage: {
  notification?: { title?: string; body?: string };
  data?: Record<string, unknown>;
} | null | undefined): void {
  if (!remoteMessage) return;

  const { notification, data } = remoteMessage;
  const title =
    notification?.title ||
    (typeof data?.title === 'string' ? data.title : undefined) ||
    'Notification';
  const body =
    notification?.body ||
    (typeof data?.body === 'string' ? data.body : undefined) ||
    (typeof data?.message === 'string' ? data.message : undefined) ||
    '';

  if (!title && !body) return;

  displayPushNotification(title, body, data);
}
