// Security Utilities for Token Management and Security
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

export interface SecurityConfig {
  tokenPrefix: string;
  maxRetries: number;
  retryDelay: number;
}

const KEYCHAIN_SERVICE = 'com.tracsopro.auth.tokens';
const KEYCHAIN_USERNAME = 'auth_tokens';

class SecurityManager {
  private config: SecurityConfig;
  private lastTokenStoreTime: number = 0;
  private keychainAvailable: boolean | null = null;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      tokenPrefix: 'gt_',
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  private async canUseKeychain(): Promise<boolean> {
    if (this.keychainAvailable !== null) {
      return this.keychainAvailable;
    }
    try {
      await Keychain.getSupportedBiometryType();
      this.keychainAvailable = true;
    } catch {
      this.keychainAvailable = false;
    }
    return this.keychainAvailable;
  }

  private legacyTokenKey(): string {
    return `${this.config.tokenPrefix}tokens`;
  }

  private legacyUserKey(): string {
    return `${this.config.tokenPrefix}user`;
  }

  /**
   * Store tokens in Keychain (secure enclave). Migrates away from AsyncStorage.
   */
  async storeTokens(tokenData: TokenData): Promise<boolean> {
    try {
      if (!tokenData?.accessToken) {
        console.error('Error storing tokens: Invalid token data provided');
        return false;
      }

      const payload = JSON.stringify(tokenData);

      if (await this.canUseKeychain()) {
        await Keychain.setGenericPassword(KEYCHAIN_USERNAME, payload, {
          service: KEYCHAIN_SERVICE,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        await AsyncStorage.removeItem(this.legacyTokenKey());
      } else {
        await AsyncStorage.setItem(this.legacyTokenKey(), payload);
      }

      this.lastTokenStoreTime = Date.now();
      if (__DEV__) {
        console.log('💾 Tokens stored securely', {
          storage: (await this.canUseKeychain()) ? 'keychain' : 'async-storage',
          expiresAt: tokenData.expiresAt
            ? new Date(tokenData.expiresAt).toISOString()
            : 'N/A',
        });
      }
      return true;
    } catch (error) {
      console.error('Error storing tokens:', error);
      return false;
    }
  }

  /**
   * Retrieve tokens from Keychain, with one-time migration from legacy AsyncStorage.
   */
  async getTokens(): Promise<TokenData | null> {
    try {
      if (await this.canUseKeychain()) {
        const credentials = await Keychain.getGenericPassword({
          service: KEYCHAIN_SERVICE,
        });
        if (credentials?.password) {
          return JSON.parse(credentials.password) as TokenData;
        }
      }

      const legacy = await AsyncStorage.getItem(this.legacyTokenKey());
      if (!legacy) {
        return null;
      }

      const tokens = JSON.parse(legacy) as TokenData;
      await this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Error retrieving tokens:', error);
      return null;
    }
  }

  async areTokensValid(): Promise<boolean> {
    try {
      const tokens = await this.getTokens();
      if (!tokens) return false;
      return tokens.expiresAt > Date.now();
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }

  async clearTokens(): Promise<boolean> {
    try {
      if (await this.canUseKeychain()) {
        await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
      }
      await AsyncStorage.multiRemove([
        this.legacyTokenKey(),
        this.legacyUserKey(),
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

  /** User profile (non-secret) — AsyncStorage is acceptable */
  async storeUserData(userData: any): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.legacyUserKey(), JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const raw = await AsyncStorage.getItem(this.legacyUserKey());
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || this.generateSecureRandom(16);
    let hash: string;
    try {
      hash = typeof btoa !== 'undefined' ? btoa(password + actualSalt) : password + actualSalt;
    } catch {
      hash = password + actualSalt;
    }
    return { hash, salt: actualSalt };
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: testHash } = this.hashPassword(password, salt);
    return testHash === hash;
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

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

    return { isValid: score >= 4, score, feedback };
  }

  async isDeviceSecure(): Promise<boolean> {
    return true;
  }

  generateSessionId(): string {
    return `session_${Date.now()}_${this.generateSecureRandom(16)}`;
  }

  isValidSessionId(sessionId: string): boolean {
    return /^session_\d+_[a-zA-Z0-9]{16}$/.test(sessionId);
  }
}

export const securityManager = new SecurityManager();

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
