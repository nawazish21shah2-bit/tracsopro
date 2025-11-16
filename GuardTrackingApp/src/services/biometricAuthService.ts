/**
 * Biometric Authentication Service
 * Fingerprint and Face ID authentication for enhanced security
 */

import TouchID from 'react-native-touch-id';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorHandler } from '../utils/errorHandler';
import notificationService from './notificationService';

interface BiometricConfig {
  title: string;
  subtitle?: string;
  description?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  color?: string;
  imageColor?: string;
  imageErrorColor?: string;
  sensorDescription?: string;
  sensorErrorDescription?: string;
  passcodeFallback: boolean;
  showErrorMessage: boolean;
  unifiedErrors: boolean;
}

interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: 'TouchID' | 'FaceID' | 'Fingerprint' | 'None';
  isEnrolled: boolean;
  hasHardware: boolean;
}

interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometryType?: string;
  timestamp: number;
}

class BiometricAuthService {
  private isInitialized: boolean = false;
  private capabilities: BiometricCapabilities | null = null;
  private config: BiometricConfig;
  private authAttempts: number = 0;
  private maxAttempts: number = 3;
  private lockoutTime: number = 5 * 60 * 1000; // 5 minutes
  private lastFailedAttempt: number = 0;

  constructor() {
    this.config = {
      title: 'Biometric Authentication',
      subtitle: 'Verify your identity',
      description: 'Use your fingerprint or face to authenticate',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      color: '#1C6CA9',
      passcodeFallback: true,
      showErrorMessage: true,
      unifiedErrors: false,
    };
  }

  /**
   * Initialize biometric authentication service
   */
  async initialize(): Promise<boolean> {
    try {
      this.capabilities = await this.checkBiometricCapabilities();
      
      if (this.capabilities.isAvailable) {
        await this.loadConfig();
        this.isInitialized = true;
        console.log('🔐 Biometric authentication initialized:', this.capabilities.biometryType);
        return true;
      } else {
        console.log('🔐 Biometric authentication not available on this device');
        return false;
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'biometric_auth_init');
      return false;
    }
  }

  /**
   * Check biometric capabilities of the device
   */
  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const biometryType = await TouchID.isSupported();
      
      return {
        isAvailable: biometryType !== false,
        biometryType: biometryType as any || 'None',
        isEnrolled: biometryType !== false,
        hasHardware: biometryType !== false,
      };
    } catch (error) {
      return {
        isAvailable: false,
        biometryType: 'None',
        isEnrolled: false,
        hasHardware: false,
      };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(reason?: string): Promise<BiometricAuthResult> {
    const startTime = Date.now();
    
    try {
      // Check if service is initialized
      if (!this.isInitialized || !this.capabilities?.isAvailable) {
        throw new Error('Biometric authentication not available');
      }

      // Check lockout status
      if (this.isLockedOut()) {
        const remainingTime = this.getRemainingLockoutTime();
        throw new Error(`Too many failed attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`);
      }

      // Prepare authentication options
      const authConfig = {
        ...this.config,
        description: reason || this.config.description,
      };

      // Perform biometric authentication
      const result = await TouchID.authenticate(
        authConfig.description || 'Authenticate to continue',
        authConfig
      );

      // Authentication successful
      this.authAttempts = 0;
      this.lastFailedAttempt = 0;

      const authResult: BiometricAuthResult = {
        success: true,
        biometryType: this.capabilities.biometryType,
        timestamp: startTime,
      };

      // Log successful authentication
      await this.logAuthEvent('success', authResult);

      // Send success notification if needed
      await notificationService.sendImmediateNotification(
        'Authentication Successful',
        `Verified using ${this.capabilities.biometryType}`,
        { type: 'biometric_auth_success', timestamp: startTime }
      );

      console.log('🔐 Biometric authentication successful');
      return authResult;

    } catch (error: any) {
      // Handle authentication failure
      this.authAttempts++;
      this.lastFailedAttempt = Date.now();

      const authResult: BiometricAuthResult = {
        success: false,
        error: this.parseAuthError(error),
        timestamp: startTime,
      };

      // Log failed authentication
      await this.logAuthEvent('failure', authResult);

      // Check if user should be locked out
      if (this.authAttempts >= this.maxAttempts) {
        await this.handleLockout();
      }

      console.log('🔐 Biometric authentication failed:', authResult.error);
      return authResult;
    }
  }

  /**
   * Quick authentication for frequent actions
   */
  async quickAuth(action: string): Promise<boolean> {
    try {
      const result = await this.authenticate(`Authenticate to ${action}`);
      return result.success;
    } catch (error) {
      ErrorHandler.handleError(error, 'biometric_quick_auth', false);
      return false;
    }
  }

  /**
   * Authenticate for check-in/check-out
   */
  async authenticateForShift(action: 'check-in' | 'check-out', location?: string): Promise<boolean> {
    try {
      const locationText = location ? ` at ${location}` : '';
      const reason = `Verify your identity to ${action}${locationText}`;
      
      const result = await this.authenticate(reason);
      
      if (result.success) {
        // Log shift authentication
        await this.logAuthEvent('shift_auth', {
          ...result,
          action,
          location,
        });
      }
      
      return result.success;
    } catch (error) {
      ErrorHandler.handleError(error, 'biometric_shift_auth');
      return false;
    }
  }

  /**
   * Authenticate for incident reporting
   */
  async authenticateForIncident(): Promise<boolean> {
    try {
      const result = await this.authenticate('Verify your identity to submit an incident report');
      
      if (result.success) {
        await this.logAuthEvent('incident_auth', result);
      }
      
      return result.success;
    } catch (error) {
      ErrorHandler.handleError(error, 'biometric_incident_auth');
      return false;
    }
  }

  /**
   * Parse authentication error
   */
  private parseAuthError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    switch (error.name || error.code) {
      case 'LAErrorUserCancel':
      case 'UserCancel':
        return 'Authentication was cancelled by user';
      
      case 'LAErrorUserFallback':
      case 'UserFallback':
        return 'User chose to use passcode instead';
      
      case 'LAErrorSystemCancel':
      case 'SystemCancel':
        return 'Authentication was cancelled by system';
      
      case 'LAErrorPasscodeNotSet':
      case 'PasscodeNotSet':
        return 'Passcode is not set on device';
      
      case 'LAErrorBiometryNotAvailable':
      case 'BiometryNotAvailable':
        return 'Biometric authentication is not available';
      
      case 'LAErrorBiometryNotEnrolled':
      case 'BiometryNotEnrolled':
        return 'No biometric data is enrolled on device';
      
      case 'LAErrorBiometryLockout':
      case 'BiometryLockout':
        return 'Biometric authentication is locked out';
      
      case 'LAErrorAuthenticationFailed':
      case 'AuthenticationFailed':
        return 'Authentication failed - biometric not recognized';
      
      default:
        return error.message || 'Biometric authentication failed';
    }
  }

  /**
   * Check if user is locked out
   */
  private isLockedOut(): boolean {
    if (this.authAttempts < this.maxAttempts) return false;
    
    const timeSinceLastFail = Date.now() - this.lastFailedAttempt;
    return timeSinceLastFail < this.lockoutTime;
  }

  /**
   * Get remaining lockout time in milliseconds
   */
  private getRemainingLockoutTime(): number {
    if (!this.isLockedOut()) return 0;
    
    const timeSinceLastFail = Date.now() - this.lastFailedAttempt;
    return this.lockoutTime - timeSinceLastFail;
  }

  /**
   * Handle user lockout
   */
  private async handleLockout(): Promise<void> {
    try {
      const lockoutMinutes = Math.ceil(this.lockoutTime / 60000);
      
      await notificationService.sendImmediateNotification(
        '🔒 Authentication Locked',
        `Too many failed attempts. Biometric authentication locked for ${lockoutMinutes} minutes.`,
        { 
          type: 'biometric_lockout', 
          lockoutTime: this.lockoutTime,
          attempts: this.authAttempts 
        }
      );

      // Log lockout event
      await this.logAuthEvent('lockout', {
        success: false,
        error: 'User locked out due to too many failed attempts',
        timestamp: Date.now(),
        attempts: this.authAttempts,
      });

      console.log(`🔒 User locked out for ${lockoutMinutes} minutes after ${this.authAttempts} failed attempts`);
    } catch (error) {
      ErrorHandler.handleError(error, 'handle_biometric_lockout', false);
    }
  }

  /**
   * Reset authentication attempts
   */
  async resetAttempts(): Promise<void> {
    try {
      this.authAttempts = 0;
      this.lastFailedAttempt = 0;
      await AsyncStorage.removeItem('biometric_auth_attempts');
      console.log('🔐 Biometric authentication attempts reset');
    } catch (error) {
      ErrorHandler.handleError(error, 'reset_biometric_attempts');
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometricAuth(): Promise<boolean> {
    try {
      const capabilities = await this.checkBiometricCapabilities();
      
      if (!capabilities.isAvailable) {
        Alert.alert(
          'Biometric Authentication Unavailable',
          'Your device does not support biometric authentication or no biometric data is enrolled.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Test authentication to ensure it works
      const testResult = await this.authenticate('Enable biometric authentication for this app');
      
      if (testResult.success) {
        await AsyncStorage.setItem('biometric_auth_enabled', 'true');
        console.log('🔐 Biometric authentication enabled');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'enable_biometric_auth');
      return false;
    }
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometricAuth(): Promise<void> {
    try {
      await AsyncStorage.setItem('biometric_auth_enabled', 'false');
      console.log('🔐 Biometric authentication disabled');
    } catch (error) {
      ErrorHandler.handleError(error, 'disable_biometric_auth');
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricAuthEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('biometric_auth_enabled');
      return enabled === 'true';
    } catch (error) {
      ErrorHandler.handleError(error, 'check_biometric_enabled', false);
      return false;
    }
  }

  /**
   * Update biometric configuration
   */
  async updateConfig(newConfig: Partial<BiometricConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      await AsyncStorage.setItem('biometric_config', JSON.stringify(this.config));
      console.log('🔐 Biometric configuration updated');
    } catch (error) {
      ErrorHandler.handleError(error, 'update_biometric_config');
    }
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('biometric_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'load_biometric_config', false);
    }
  }

  /**
   * Log authentication event
   */
  private async logAuthEvent(type: string, data: any): Promise<void> {
    try {
      const logEntry = {
        type,
        timestamp: Date.now(),
        deviceInfo: {
          platform: Platform.OS,
          biometryType: this.capabilities?.biometryType,
        },
        ...data,
      };

      // Store in cache for sync to backend
      await AsyncStorage.setItem(
        `biometric_log_${Date.now()}`,
        JSON.stringify(logEntry)
      );

      // Add to sync queue for backend logging
      const { cacheService } = await import('./cacheService');
      await cacheService.addToSyncQueue('biometric_auth_log', logEntry);
    } catch (error) {
      ErrorHandler.handleError(error, 'log_biometric_auth_event', false);
    }
  }

  /**
   * Get authentication statistics
   */
  async getAuthStats() {
    try {
      const enabled = await this.isBiometricAuthEnabled();
      const lockoutTime = this.getRemainingLockoutTime();
      
      return {
        isEnabled: enabled,
        isAvailable: this.capabilities?.isAvailable || false,
        biometryType: this.capabilities?.biometryType || 'None',
        isEnrolled: this.capabilities?.isEnrolled || false,
        failedAttempts: this.authAttempts,
        isLockedOut: this.isLockedOut(),
        lockoutTimeRemaining: lockoutTime,
        maxAttempts: this.maxAttempts,
      };
    } catch (error) {
      ErrorHandler.handleError(error, 'get_biometric_stats');
      return null;
    }
  }

  /**
   * Get biometric capabilities
   */
  getBiometricCapabilities(): BiometricCapabilities | null {
    return this.capabilities;
  }

  /**
   * Show biometric setup guide
   */
  showSetupGuide(): void {
    const biometryType = this.capabilities?.biometryType || 'biometric';
    const setupMessage = Platform.select({
      ios: `To use ${biometryType} authentication:\n\n1. Go to Settings > ${biometryType === 'FaceID' ? 'Face ID' : 'Touch ID'} & Passcode\n2. Enable ${biometryType} for this app\n3. Return to the app and try again`,
      android: 'To use fingerprint authentication:\n\n1. Go to Settings > Security > Fingerprint\n2. Add your fingerprint\n3. Return to the app and try again',
      default: 'Please set up biometric authentication in your device settings.',
    });

    Alert.alert(
      'Set Up Biometric Authentication',
      setupMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => {
          // This would open device settings - implementation depends on platform
          console.log('Opening device settings for biometric setup');
        }},
      ]
    );
  }
}

export default new BiometricAuthService();
export type { BiometricConfig, BiometricCapabilities, BiometricAuthResult };
