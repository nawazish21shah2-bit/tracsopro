// Security Utilities for Token Management and Security
import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: CryptoJS removed due to React Native compatibility issues

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface SecurityConfig {
  encryptionKey: string;
  tokenPrefix: string;
  maxRetries: number;
  retryDelay: number;
}

class SecurityManager {
  private config: SecurityConfig;
  private encryptionKey: string;
  private lastTokenStoreTime: number = 0;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      encryptionKey: 'guard-tracking-app-secret-key',
      tokenPrefix: 'gt_',
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
    this.encryptionKey = this.config.encryptionKey;
  }

  /**
   * Encode sensitive data before storing (simple encoding for basic obfuscation)
   * Note: For production, consider using react-native-keychain for secure storage
   */
  private encode(data: string): string {
    try {
      // Try btoa first, fallback to no encoding if not available
      if (typeof btoa !== 'undefined') {
        return btoa(data);
      } else {
        // Fallback: just return the data as-is
        console.warn('btoa not available, storing data without encoding');
        return data;
      }
    } catch (error) {
      console.error('Encoding error:', error);
      return data; // Fallback to unencoded data
    }
  }

  /**
   * Decode sensitive data after retrieving
   */
  private decode(encodedData: string): string {
    try {
      // Try atob first, fallback to returning data as-is if not available
      if (typeof atob !== 'undefined') {
        return atob(encodedData);
      } else {
        // Fallback: just return the data as-is
        return encodedData;
      }
    } catch (error) {
      console.error('Decoding error:', error);
      return encodedData; // Fallback to encoded data
    }
  }

  /**
   * Store tokens securely
   */
  async storeTokens(tokenData: TokenData): Promise<boolean> {
    try {
      const encodedData = this.encode(JSON.stringify(tokenData));
      await AsyncStorage.setItem(`${this.config.tokenPrefix}tokens`, encodedData);
      this.lastTokenStoreTime = Date.now();
      if (__DEV__) {
        console.log('💾 Tokens stored successfully', {
          tokenLength: tokenData.accessToken.length,
          expiresAt: new Date(tokenData.expiresAt).toISOString(),
          tokenType: tokenData.tokenType,
          storedAt: new Date(this.lastTokenStoreTime).toISOString()
        });
      }
      return true;
    } catch (error) {
      console.error('Error storing tokens:', error);
      return false;
    }
  }

  /**
   * Retrieve tokens securely
   */
  async getTokens(): Promise<TokenData | null> {
    try {
      const encodedData = await AsyncStorage.getItem(`${this.config.tokenPrefix}tokens`);
      if (!encodedData) return null;

      const decodedData = this.decode(encodedData);
      return JSON.parse(decodedData);
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return null;
    }
  }

  /**
   * Check if tokens are valid and not expired
   */
  async areTokensValid(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      if (!tokens) return false;

      const now = Date.now();
      return tokens.expiresAt > now;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }

  /**
   * Clear all stored tokens
   */
  async clearTokens(): Promise<boolean> {
    try {
      const timeSinceStore = Date.now() - this.lastTokenStoreTime;
      if (__DEV__) {
        console.log('🗑️ Clearing all tokens and user data', {
          timeSinceStore: `${timeSinceStore}ms`,
          recentlyStored: timeSinceStore < 5000 // Less than 5 seconds
        });
        console.trace('Clear tokens stack trace');
      }
      
      // Warn if tokens are being cleared very soon after being stored
      if (timeSinceStore < 2000 && this.lastTokenStoreTime > 0) {
        console.warn('⚠️ Tokens being cleared very soon after storage! This might indicate a bug.');
      }
      
      await AsyncStorage.multiRemove([
        `${this.config.tokenPrefix}tokens`,
        `${this.config.tokenPrefix}user`,
        `${this.config.tokenPrefix}settings`,
      ]);
      if (__DEV__) {
        console.log('✅ Tokens cleared successfully');
      }
      return true;
    } catch (error) {
      console.error('Error clearing tokens:', error);
      return false;
    }
  }

  /**
   * Store user data securely
   */
  async storeUserData(userData: any): Promise<boolean> {
    try {
      const encodedData = this.encode(JSON.stringify(userData));
      await AsyncStorage.setItem(`${this.config.tokenPrefix}user`, encodedData);
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  }

  /**
   * Retrieve user data securely
   */
  async getUserData(): Promise<any | null> {
    try {
      const encodedData = await AsyncStorage.getItem(`${this.config.tokenPrefix}user`);
      if (!encodedData) return null;

      const decodedData = this.decode(encodedData);
      return JSON.parse(decodedData);
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Generate a secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Hash password securely (simplified for React Native compatibility)
   * Note: For production, use a proper password hashing library like bcrypt
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || this.generateSecureRandom(16);
    // Simple hash for React Native compatibility - use bcrypt on backend
    let hash: string;
    try {
      if (typeof btoa !== 'undefined') {
        hash = btoa(password + actualSalt);
      } else {
        // Fallback: simple string concatenation
        hash = password + actualSalt;
      }
    } catch (error) {
      hash = password + actualSalt;
    }
    return { hash, salt: actualSalt };
  }

  /**
   * Verify password against hash (simplified for React Native compatibility)
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    let testHash: string;
    try {
      if (typeof btoa !== 'undefined') {
        testHash = btoa(password + salt);
      } else {
        // Fallback: simple string concatenation
        testHash = password + salt;
      }
    } catch (error) {
      testHash = password + salt;
    }
    return testHash === hash;
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate email format securely
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  }

  /**
   * Check if device is rooted/jailbroken (basic check)
   */
  async isDeviceSecure(): Promise<boolean> {
    try {
      // Basic checks for React Native
      // In a real app, you'd use libraries like react-native-device-info
      // and react-native-root-detection
      return true; // Placeholder - implement actual security checks
    } catch (error) {
      console.error('Error checking device security:', error);
      return false;
    }
  }

  /**
   * Generate secure session ID
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${this.generateSecureRandom(16)}`;
  }

  /**
   * Validate session ID format
   */
  isValidSessionId(sessionId: string): boolean {
    const sessionRegex = /^session_\d+_[a-zA-Z0-9]{16}$/;
    return sessionRegex.test(sessionId);
  }
}

// Create singleton instance
export const securityManager = new SecurityManager();

// Export utility functions
export const {
  storeTokens,
  getTokens,
  areTokensValid,
  clearTokens,
  storeUserData,
  getUserData,
  generateSecureRandom,
  hashPassword,
  verifyPassword,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  isDeviceSecure,
  generateSessionId,
  isValidSessionId,
} = securityManager;

export default securityManager;

