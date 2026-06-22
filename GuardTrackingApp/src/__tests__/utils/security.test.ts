// Security utilities tests (Keychain + AsyncStorage token storage)
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
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

    it('retrieves tokens from AsyncStorage fallback', async () => {
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockTokens));

      const tokens = await getTokens();
      expect(tokens).toEqual(mockTokens);
    });

    it('validates token expiration', async () => {
      const validTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(validTokens));

      const isValid = await areTokensValid();
      expect(isValid).toBe(true);
    });

    it('detects expired tokens', async () => {
      const expiredTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresAt: Date.now() - 3600000,
        tokenType: 'Bearer',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(expiredTokens));

      const isValid = await areTokensValid();
      expect(isValid).toBe(false);
    });

    it('clears stored tokens', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const result = await clearTokens();
      expect(result).toBe(true);
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });
  });

  describe('User Data Management', () => {
    it('stores and retrieves user data', async () => {
      const userData = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      await storeUserData(userData);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(userData));

      const retrieved = await getUserData();
      expect(retrieved).toEqual(userData);
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

    it('generates and validates session IDs', () => {
      const sessionId = generateSessionId();
      expect(sessionId).toMatch(/^session_\d+_[a-zA-Z0-9]{16}$/);
      expect(isValidSessionId(sessionId)).toBe(true);
      expect(isValidSessionId('invalid_session_id')).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('hashes and verifies passwords', () => {
      const password = 'testpassword';
      const { hash, salt } = hashPassword(password);

      expect(hash).toBeDefined();
      expect(salt).toHaveLength(16);
      expect(verifyPassword(password, hash, salt)).toBe(true);
      expect(verifyPassword('wrongpassword', hash, salt)).toBe(false);
    });

    it('validates password strength', () => {
      const weakResult = validatePasswordStrength('weak');
      const strongResult = validatePasswordStrength('StrongPass123!');

      expect(weakResult.isValid).toBe(false);
      expect(strongResult.isValid).toBe(true);
    });
  });

  describe('Input Sanitization', () => {
    it('sanitizes malicious input', () => {
      expect(sanitizeInput('<script>alert("xss")</script>Hello')).not.toContain('<');
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")');
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });
  });

  describe('Email Validation', () => {
    it('validates email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
    });
  });
});
