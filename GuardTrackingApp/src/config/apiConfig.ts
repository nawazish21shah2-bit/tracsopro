/**
 * API Configuration
 *
 * Development: set DEV_LOCAL_IP to your machine's LAN IP for physical devices.
 * iOS Simulator: keep USE_IOS_SIMULATOR true (localhost). Physical iOS: set USE_IOS_SIMULATOR false.
 * Local LAN release APK: set USE_LOCAL_LAN_RELEASE true (same WiFi as laptop backend).
 * Production store: set USE_LOCAL_LAN_RELEASE false and use HTTPS URLs below.
 */

import { Platform } from 'react-native';

// --- Local LAN release (physical phone + laptop backend on same WiFi) ---
/** Keep false for production/client builds. */
const USE_LOCAL_LAN_RELEASE = false;
/** LAN IP of your dev machine (run `ipconfig` on Windows). */
const DEV_LOCAL_IP = '192.168.1.6';

// --- Production (store release) — must use HTTPS ---
const PRODUCTION_API_URL =
  'https://api.tracsopro.com/api'; // Update before store release
const PRODUCTION_WS_URL = 'https://api.tracsopro.com';

/** Set true when running on Android emulator (uses 10.0.2.2). */
const USE_ANDROID_EMULATOR = true;
/** Set true for iOS Simulator (uses localhost). Set false for physical iOS devices (uses DEV_LOCAL_IP). */
const USE_IOS_SIMULATOR = true;

const DEV_API_URL = `http://${DEV_LOCAL_IP}:3000/api`;
const DEV_WS_URL = `http://${DEV_LOCAL_IP}:3000`;
const DEV_API_URL_ANDROID_EMULATOR = 'http://10.0.2.2:3000/api';
const DEV_WS_URL_ANDROID_EMULATOR = 'http://10.0.2.2:3000';
const DEV_API_URL_IOS_SIMULATOR = 'http://localhost:3000/api';
const DEV_WS_URL_IOS_SIMULATOR = 'http://localhost:3000';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

const assertProductionUrls = (): void => {
  if (isDev || USE_LOCAL_LAN_RELEASE) return;
  const urls = [PRODUCTION_API_URL, PRODUCTION_WS_URL];
  for (const url of urls) {
    if (!url.startsWith('https://')) {
      console.error(
        `[apiConfig] Production URL must use HTTPS: ${url}. Update src/config/apiConfig.ts before release.`
      );
    }
  }
};

assertProductionUrls();

export const getApiBaseUrl = (): string => {
  // Release APK on same WiFi as laptop backend
  if (USE_LOCAL_LAN_RELEASE && !isDev) {
    return DEV_API_URL;
  }
  if (isDev) {
    if (Platform.OS === 'android' && USE_ANDROID_EMULATOR) {
      return DEV_API_URL_ANDROID_EMULATOR;
    }
    if (Platform.OS === 'ios' && USE_IOS_SIMULATOR) {
      return DEV_API_URL_IOS_SIMULATOR;
    }
    return DEV_API_URL;
  }
  return PRODUCTION_API_URL;
};

export const getWebSocketUrl = (): string => {
  if (USE_LOCAL_LAN_RELEASE && !isDev) {
    return DEV_WS_URL;
  }
  if (isDev) {
    if (Platform.OS === 'android' && USE_ANDROID_EMULATOR) {
      return DEV_WS_URL_ANDROID_EMULATOR;
    }
    if (Platform.OS === 'ios' && USE_IOS_SIMULATOR) {
      return DEV_WS_URL_IOS_SIMULATOR;
    }
    return DEV_WS_URL;
  }
  return PRODUCTION_WS_URL;
};

export const isDevelopment = (): boolean => isDev;

export const getConfigInfo = () => ({
  isDev,
  useLocalLanRelease: USE_LOCAL_LAN_RELEASE,
  apiUrl: getApiBaseUrl(),
  wsUrl: getWebSocketUrl(),
  platform: Platform.OS,
  useAndroidEmulator: USE_ANDROID_EMULATOR,
  useIosSimulator: USE_IOS_SIMULATOR,
});

export const API_CONFIG = {
  USE_LOCAL_LAN_RELEASE,
  PRODUCTION_API_URL,
  PRODUCTION_WS_URL,
  DEV_LOCAL_IP,
  DEV_API_URL,
  DEV_WS_URL,
};
