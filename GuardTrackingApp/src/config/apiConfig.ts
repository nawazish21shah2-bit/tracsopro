/**
 * API Configuration
 * 
 * This file centralizes all API and WebSocket URLs for easy configuration.
 * 
 * TO DEPLOY TO PRODUCTION:
 * 1. Replace PRODUCTION_API_URL with your live backend URL
 * 2. Replace PRODUCTION_WS_URL with your live WebSocket URL (usually same as API without /api)
 * 3. Build the app in release mode (not __DEV__)
 */

import { Platform } from 'react-native';

// ============================================
// PRODUCTION CONFIGURATION
// ============================================
// Replace these with your Render backend URLs after deployment
// Example: https://your-app-name.onrender.com/api
const PRODUCTION_API_URL = 'https://your-app-name.onrender.com/api';
const PRODUCTION_WS_URL = 'https://your-app-name.onrender.com';

// ============================================
// DEVELOPMENT CONFIGURATION
// ============================================
// Your local IP address for development
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
const LOCAL_IP = '192.168.1.12'; // ⚠️ CHANGE THIS TO YOUR ACTUAL IP ADDRESS

// Development URLs
const DEV_API_URL_ANDROID = `http://${LOCAL_IP}:3000/api`;
const DEV_API_URL_IOS = `http://${LOCAL_IP}:3000/api`;
const DEV_WS_URL = `http://${LOCAL_IP}:3000`;

// For Android Emulator (alternative)
const DEV_API_URL_ANDROID_EMULATOR = 'http://10.0.2.2:3000/api';
const DEV_WS_URL_ANDROID_EMULATOR = 'http://10.0.2.2:3000';

// ============================================
// CONFIGURATION LOGIC
// ============================================
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

/**
 * Get the API base URL based on environment
 */
export const getApiBaseUrl = (): string => {
  if (!isDev) {
    // Production mode
    return PRODUCTION_API_URL;
  }

  // Development mode
  if (Platform.OS === 'android') {
    // For Android emulator, you can use 10.0.2.2
    // For physical Android device, use LOCAL_IP
    // Uncomment the line below if using Android emulator:
    // return DEV_API_URL_ANDROID_EMULATOR;
    return DEV_API_URL_ANDROID;
  } else {
    // iOS (simulator or physical device)
    return DEV_API_URL_IOS;
  }
};

/**
 * Get the WebSocket base URL based on environment
 */
export const getWebSocketUrl = (): string => {
  if (!isDev) {
    // Production mode
    return PRODUCTION_WS_URL;
  }

  // Development mode
  if (Platform.OS === 'android') {
    // Uncomment the line below if using Android emulator:
    // return DEV_WS_URL_ANDROID_EMULATOR;
    return DEV_WS_URL;
  } else {
    // iOS
    return DEV_WS_URL;
  }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return isDev;
};

/**
 * Get current configuration info (for debugging)
 */
export const getConfigInfo = () => {
  return {
    isDev,
    apiUrl: getApiBaseUrl(),
    wsUrl: getWebSocketUrl(),
    platform: Platform.OS,
  };
};

// Export constants for direct use if needed
export const API_CONFIG = {
  PRODUCTION_API_URL,
  PRODUCTION_WS_URL,
  DEV_API_URL_ANDROID,
  DEV_API_URL_IOS,
  DEV_WS_URL,
  LOCAL_IP,
};



