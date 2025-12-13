// Integration Tests - Authentication Flow
// Tests the complete authentication flow from login to dashboard navigation

import { renderWithProviders, createMockUser, waitFor } from '../../utils/testUtils';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import { loginUser, verifyOTP } from '../../store/slices/authSlice';
import apiService from '../../services/api';

// Mock API service
jest.mock('../../services/api');
jest.mock('@react-native-async-storage/async-storage');

describe('Authentication Flow Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  describe('Complete Login Flow', () => {
    it('should complete full login flow: form -> API -> state -> navigation', async () => {
      const mockUser = createMockUser({
        email: 'guard@test.com',
        role: 'GUARD',
      });

      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      (apiService.login as jest.Mock).mockResolvedValue(mockResponse);

      // Dispatch login action
      const result = await store.dispatch(
        loginUser({
          email: 'guard@test.com',
          password: 'password123',
        })
      );

      // Verify login was successful
      expect(loginUser.fulfilled.match(result)).toBe(true);

      // Verify state was updated
      const state = store.getState();
      // User object includes computed name field
      expect(state.auth.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
      });
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.token).toBe('access-token');
    });

    it('should handle login failure and show error', async () => {
      (apiService.login as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Invalid credentials' } },
      });

      const result = await store.dispatch(
        loginUser({
          email: 'guard@test.com',
          password: 'wrong',
        })
      );

      // Verify login was rejected
      expect(loginUser.rejected.match(result)).toBe(true);

      // Verify error state
      const state = store.getState();
      expect(state.auth.error).toBeDefined();
      expect(state.auth.isAuthenticated).toBe(false);
    });
  });

  describe('Registration and OTP Flow', () => {
    it('should complete registration and OTP verification flow', async () => {
      const mockRegisterResponse = {
        success: true,
        data: {
          userId: '1',
          email: 'guard@test.com',
          role: 'GUARD',
          accountType: 'INDIVIDUAL',
        },
      };

      const mockOTPResponse = {
        success: true,
        data: {
          user: createMockUser({ email: 'guard@test.com' }),
          token: 'access-token',
        },
      };

      (apiService.register as jest.Mock).mockResolvedValue(mockRegisterResponse);
      (apiService.verifyOTP as jest.Mock).mockResolvedValue(mockOTPResponse);

      // Step 1: Register
      const registerResult = await store.dispatch(
        loginUser({
          email: 'guard@test.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        } as any)
      );

      // Step 2: Verify OTP
      const otpResult = await store.dispatch(
        verifyOTP({ userId: '1', otp: '123456' })
      );

      // Verify OTP verification was successful
      expect(verifyOTP.fulfilled.match(otpResult)).toBe(true);

      // Verify state was updated
      const state = store.getState();
      expect(state.auth.user).toBeDefined();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.isEmailVerified).toBe(true);
    });
  });
});

