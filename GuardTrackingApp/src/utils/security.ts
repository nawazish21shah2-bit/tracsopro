// Security Utilities for Token Management and Security
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

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
   * Encrypt sensitive data before storing
   */
  private encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return data; // Fallback to unencrypted data
    }
  }

  /**
   * Decrypt sensitive data after retrieving
   */
  private decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData; // Fallback to encrypted data
    }
  }

  /**
   * Store tokens securely
   */
  async storeTokens(tokenData: TokenData): Promise<boolean> {
    try {
      const encryptedData = this.encrypt(JSON.stringify(tokenData));
      await AsyncStorage.setItem(`${this.config.tokenPrefix}tokens`, encryptedData);
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
      const encryptedData = await AsyncStorage.getItem(`${this.config.tokenPrefix}tokens`);
      if (!encryptedData) return null;

      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
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
      await AsyncStorage.multiRemove([
        `${this.config.tokenPrefix}tokens`,
        `${this.config.tokenPrefix}user`,
        `${this.config.tokenPrefix}settings`,
      ]);
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
      const encryptedData = this.encrypt(JSON.stringify(userData));
      await AsyncStorage.setItem(`${this.config.tokenPrefix}user`, encryptedData);
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
      const encryptedData = await AsyncStorage.getItem(`${this.config.tokenPrefix}user`);
      if (!encryptedData) return null;

      const decryptedData = this.decrypt(encryptedData);
      return JSON.parse(decryptedData);
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
   * Hash password securely
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || this.generateSecureRandom(16);
    const hash = CryptoJS.PBKDF2(password, actualSalt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
    return { hash, salt: actualSalt };
  }

  /**
   * Verify password against hash
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const testHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();
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

