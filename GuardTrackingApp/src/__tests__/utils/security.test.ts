// Comprehensive Security Utilities Tests
import {
  securityManager,
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
  generateSessionId,
  isValidSessionId,
} from '../../utils/security';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock CryptoJS
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn((data, key) => ({
      toString: () => `encrypted_${data}`,
    })),
    decrypt: jest.fn((encryptedData, key) => ({
      toString: jest.fn(() => encryptedData.replace('encrypted_', '')),
    })),
  },
  enc: {
    Utf8: 'utf8',
  },
  PBKDF2: jest.fn((password, salt, options) => ({
    toString: () => `hashed_${password}_${salt}`,
  })),
}));

describe('Security Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Management', () => {
    it('stores tokens securely', async () => {
      const tokenData = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      const result = await storeTokens(tokenData);
      expect(result).toBe(true);
    });

    it('retrieves tokens securely', async () => {
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      // Mock AsyncStorage.getItem to return encrypted tokens
      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(JSON.stringify(mockTokens));

      const tokens = await getTokens();
      expect(tokens).toEqual(mockTokens);
    });

    it('validates token expiration', async () => {
      const validTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        tokenType: 'Bearer',
      };

      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(JSON.stringify(validTokens));

      const isValid = await areTokensValid();
      expect(isValid).toBe(true);
    });

    it('detects expired tokens', async () => {
      const expiredTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() - 3600000, // 1 hour ago
        tokenType: 'Bearer',
      };

      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(JSON.stringify(expiredTokens));

      const isValid = await areTokensValid();
      expect(isValid).toBe(false);
    });

    it('clears all tokens', async () => {
      const { multiRemove } = require('@react-native-async-storage/async-storage');
      multiRemove.mockResolvedValue(undefined);

      const result = await clearTokens();
      expect(result).toBe(true);
      expect(multiRemove).toHaveBeenCalledWith([
        'gt_tokens',
        'gt_user',
        'gt_settings',
      ]);
    });
  });

  describe('User Data Management', () => {
    it('stores user data securely', async () => {
      const userData = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await storeUserData(userData);
      expect(result).toBe(true);
    });

    it('retrieves user data securely', async () => {
      const mockUserData = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue(JSON.stringify(mockUserData));

      const userData = await getUserData();
      expect(userData).toEqual(mockUserData);
    });
  });

  describe('Random Generation', () => {
    it('generates secure random strings', () => {
      const random1 = generateSecureRandom(16);
      const random2 = generateSecureRandom(16);

      expect(random1).toHaveLength(16);
      expect(random2).toHaveLength(16);
      expect(random1).not.toBe(random2);
    });

    it('generates session IDs', () => {
      const sessionId = generateSessionId();
      
      expect(sessionId).toMatch(/^session_\d+_[a-zA-Z0-9]{16}$/);
    });

    it('validates session ID format', () => {
      const validSessionId = generateSessionId();
      const invalidSessionId = 'invalid_session_id';

      expect(isValidSessionId(validSessionId)).toBe(true);
      expect(isValidSessionId(invalidSessionId)).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('hashes passwords securely', () => {
      const password = 'testpassword';
      const { hash, salt } = hashPassword(password);

      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(hash).toMatch(/^hashed_/);
      expect(salt).toHaveLength(16);
    });

    it('verifies passwords correctly', () => {
      const password = 'testpassword';
      const { hash, salt } = hashPassword(password);

      expect(verifyPassword(password, hash, salt)).toBe(true);
      expect(verifyPassword('wrongpassword', hash, salt)).toBe(false);
    });

    it('validates password strength', () => {
      const weakPassword = 'weak';
      const strongPassword = 'StrongPass123!';

      const weakResult = validatePasswordStrength(weakPassword);
      const strongResult = validatePasswordStrength(strongPassword);

      expect(weakResult.isValid).toBe(false);
      expect(weakResult.score).toBeLessThan(4);
      expect(weakResult.feedback.length).toBeGreaterThan(0);

      expect(strongResult.isValid).toBe(true);
      expect(strongResult.score).toBeGreaterThanOrEqual(4);
      expect(strongResult.feedback.length).toBe(0);
    });

    it('provides specific feedback for weak passwords', () => {
      const password = 'weak';
      const result = validatePasswordStrength(password);

      expect(result.feedback).toContain('Password must be at least 8 characters long');
      expect(result.feedback).toContain('Password must contain at least one uppercase letter');
      expect(result.feedback).toContain('Password must contain at least one number');
      expect(result.feedback).toContain('Password must contain at least one special character');
    });
  });

  describe('Input Sanitization', () => {
    it('removes HTML tags', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('scriptalert("xss")/scriptHello');
    });

    it('removes javascript protocol', () => {
      const maliciousInput = 'javascript:alert("xss")';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('alert("xss")');
    });

    it('removes event handlers', () => {
      const maliciousInput = 'onclick=alert("xss")';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('alert("xss")');
    });

    it('trims whitespace', () => {
      const input = '  hello world  ';
      const sanitized = sanitizeInput(input);
      
      expect(sanitized).toBe('hello world');
    });

    it('handles empty input', () => {
      const sanitized = sanitizeInput('');
      expect(sanitized).toBe('');
    });
  });

  describe('Email Validation', () => {
    it('validates correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        '',
        'a'.repeat(255) + '@example.com', // Too long
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('enforces email length limit', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('handles encryption errors gracefully', async () => {
      // Mock encryption to throw error
      const CryptoJS = require('crypto-js');
      CryptoJS.AES.encrypt.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const tokenData = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      const result = await storeTokens(tokenData);
      expect(result).toBe(true); // Should fallback to unencrypted storage
    });

    it('handles decryption errors gracefully', async () => {
      // Mock decryption to throw error
      const CryptoJS = require('crypto-js');
      CryptoJS.AES.decrypt.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const { getItem } = require('@react-native-async-storage/async-storage');
      getItem.mockResolvedValue('encrypted_data');

      const tokens = await getTokens();
      expect(tokens).toBe('encrypted_data'); // Should return encrypted data as fallback
    });

    it('handles AsyncStorage errors gracefully', async () => {
      const { setItem } = require('@react-native-async-storage/async-storage');
      setItem.mockRejectedValue(new Error('Storage failed'));

      const tokenData = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      const result = await storeTokens(tokenData);
      expect(result).toBe(false);
    });
  });

  describe('Device Security', () => {
    it('checks device security', async () => {
      const isSecure = await securityManager.isDeviceSecure();
      expect(typeof isSecure).toBe('boolean');
    });
  });
});

