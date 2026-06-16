/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Background FCM handler must be registered before AppRegistry (React Native Firebase requirement)
try {
  const messaging = require('@react-native-firebase/messaging').default;
  const { displayRemoteMessage } = require('./src/utils/displayPushNotification');

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    // Data-only messages need manual display; notification payload is shown by the OS when backgrounded
    if (!remoteMessage?.notification?.title) {
      displayRemoteMessage(remoteMessage);
    }
  });
} catch {
  // @react-native-firebase/messaging not linked in this build
}

AppRegistry.registerComponent(appName, () => App);
