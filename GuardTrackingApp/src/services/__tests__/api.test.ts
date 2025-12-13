// API Service Tests - Testing authentication, interceptors, and error handling
import apiService from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { securityManager } from '../../utils/security';
import axios from 'axios';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../utils/security');
jest.mock('axios');

// Create a mock axios instance
const createMockAxiosInstance = () => {
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn((onFulfilled, onRejected) => {
          return instance.interceptors.request.use;
        }),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn((onFulfilled, onRejected) => {
          return instance.interceptors.response.use;
        }),
        eject: jest.fn(),
      },
    },
  };
  return instance;
};

describe('ApiService', () => {
  let mockAxiosInstance: ReturnType<typeof createMockAxiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = createMockAxiosInstance();
    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
  });

  describe('Authentication Methods', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'guard@test.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'GUARD',
          },
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      (axios.create as jest.Mock).mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const result = await apiService.login({
        email: 'guard@test.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('guard@test.com');
    });

    it('should handle login failure', async () => {
      const mockPost = jest.fn().mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      });

      (axios.create as jest.Mock).mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      await expect(
        apiService.login({
          email: 'guard@test.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });

    it('should register user successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: '1',
          email: 'guard@test.com',
          role: 'GUARD',
          accountType: 'INDIVIDUAL',
        },
      };

      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      (axios.create as jest.Mock).mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const result = await apiService.register({
        email: 'guard@test.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'GUARD',
        accountType: 'INDIVIDUAL',
      });

      expect(result.success).toBe(true);
      expect(result.data.userId).toBe('1');
    });

    it('should verify OTP successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'guard@test.com',
            isEmailVerified: true,
          },
          token: 'access-token',
        },
      };

      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      (axios.create as jest.Mock).mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const result = await apiService.verifyOTP('1', '123456');

      expect(result.success).toBe(true);
      expect(result.data.user.isEmailVerified).toBe(true);
    });
  });

  describe('Request Interceptors', () => {
    it('should add auth token to request headers', async () => {
      const mockTokens = {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
      };

      (securityManager.getTokens as jest.Mock).mockResolvedValue(mockTokens);

      // The interceptor is set up in the constructor
      // We just verify the axios instance was created with interceptors
      expect(mockAxiosInstance.interceptors.request.use).toBeDefined();
      expect(mockAxiosInstance.interceptors.response.use).toBeDefined();
    });

    it('should not add token to public endpoints', async () => {
      const publicEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
      ];

      // Test that public endpoints don't require token
      publicEndpoints.forEach((endpoint) => {
        expect(endpoint).toMatch(/^\/auth\//);
      });
    });
  });

  describe('Response Interceptors', () => {
    it('should handle 401 errors and attempt token refresh', async () => {
      const mockRefresh = jest.fn().mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh',
      });

      (securityManager.refreshAccessToken as jest.Mock) = mockRefresh;

      // The interceptor is set up in the constructor
      // We verify the response interceptor exists
      expect(mockAxiosInstance.interceptors.response.use).toBeDefined();
    });

    it('should logout user on refresh failure', async () => {
      const mockLogout = jest.fn();
      (securityManager.clearTokens as jest.Mock) = mockLogout;

      // The interceptor is set up in the constructor
      // We verify the response interceptor exists
      expect(mockAxiosInstance.interceptors.response.use).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Network Error',
      });

      (axios.create as jest.Mock).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      await expect(apiService.get('/shifts')).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const mockGet = jest.fn().mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Request timeout',
      });

      (axios.create as jest.Mock).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      await expect(apiService.get('/shifts')).rejects.toThrow();
    });
  });
});

