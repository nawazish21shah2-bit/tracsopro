// Authentication Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState, LoginForm, RegisterForm, UserRole } from '../../types';
import apiService from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { securityManager } from '../../utils/security';

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  tempUserId: null,
  tempEmail: null,
  isAuthenticated: false,
  isEmailVerified: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await apiService.login(credentials);
      if (response.success && response.data.user) {
        // Add computed name field for UI display
        const userWithName = {
          ...response.data.user,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`.trim()
        };
        
        return {
          ...response.data,
          user: userWithName
        };
      } else {
        return rejectWithValue(response.message || 'Login failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterForm, { rejectWithValue }) => {
    try {
      const response = await apiService.register(userData);
      if (response.success && response.data) {
        // New API returns userId, email, role, accountType, message
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Registration failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ userId, otp }: { userId: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.verifyOTP(userId, otp);
      if (response.success && response.data.user) {
        const userWithName = {
          ...response.data.user,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`.trim()
        };
        
        return {
          ...response.data,
          user: userWithName
        };
      } else {
        return rejectWithValue(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'OTP verification failed');
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.resendOTP(userId);
      if (response.success) {
        return response.message;
      } else {
        return rejectWithValue(response.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resend OTP');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      
      // Clear local storage
      await AsyncStorage.multiRemove([
        'authToken',
        'refreshToken',
        'userData',
        'userRole',
      ]);
      
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        // Add computed name field for UI display
        const userWithName = {
          ...response.data,
          name: `${response.data.firstName} ${response.data.lastName}`.trim()
        };
        return userWithName;
      } else {
        // Check if it's an authentication error vs network error
        const isAuthError = response.message?.includes('Unauthorized') || 
                           response.message?.includes('401') ||
                           response.message?.includes('token');
        
        // Check if tokens are still valid
        const tokensValid = await securityManager.areTokensValid();
        const shouldLogout = isAuthError && !tokensValid;
        
        return rejectWithValue({ 
          message: response.message || 'Failed to get user data',
          isAuthError,
          shouldLogout
        });
      }
    } catch (error: any) {
      // Check if it's an authentication error
      const isAuthError = error.message?.includes('Unauthorized') || 
                         error.message?.includes('401') ||
                         error.response?.status === 401;
      
      // Check if tokens are still valid - if not, we should logout
      const tokensValid = await securityManager.areTokensValid();
      const shouldLogout = isAuthError && !tokensValid;
      
      return rejectWithValue({ 
        message: error.message || 'Failed to get user data',
        isAuthError,
        shouldLogout
      });
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await apiService.updateProfile(userData);
      if (response.success && response.data) {
        // Add computed name field for UI display
        const userWithName = {
          ...response.data,
          name: `${response.data.firstName} ${response.data.lastName}`.trim()
        };
        return userWithName;
      } else {
        return rejectWithValue(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await apiService.forgotPassword(email);
      if (response.success) {
        return response.message;
      } else {
        return rejectWithValue(response.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send reset email');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      const userWithName = {
        ...action.payload,
        name: `${action.payload.firstName} ${action.payload.lastName}`.trim()
      };
      state.user = userWithName;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tempUserId = null;
      state.tempEmail = null;
      state.isAuthenticated = false;
      state.isEmailVerified = false;
      state.error = null;
    },
    setTempUserData: (state, action: PayloadAction<{ userId: string; email: string }>) => {
      state.tempUserId = action.payload.userId;
      state.tempEmail = action.payload.email;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register (returns userId and email for OTP, or tokens if OTP bypassed)
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Check if tokens are returned (dev mode OTP bypass)
        if (action.payload.token && action.payload.user) {
          // OTP was bypassed - user is already authenticated
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
          state.isEmailVerified = true;
          state.tempUserId = null;
          state.tempEmail = null;
        } else {
          // Normal flow - need OTP verification
          state.tempUserId = action.payload.userId;
          state.tempEmail = action.payload.email;
        }
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.isEmailVerified = true;
        state.tempUserId = null;
        state.tempEmail = null;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resend OTP
    builder
      .addCase(resendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get current user
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        const errorMessage = typeof payload === 'string' ? payload : payload?.message || 'Failed to get user data';
        const isAuthError = typeof payload === 'object' && payload?.isAuthError;
        const shouldLogout = typeof payload === 'object' && payload?.shouldLogout;
        
        state.error = errorMessage;
        
        // Only set isAuthenticated to false if:
        // 1. It's explicitly marked as shouldLogout (tokens are invalid)
        // 2. It's an auth error AND user was not already authenticated (initial check failed)
        // Don't log out on network errors or temporary failures
        if (shouldLogout) {
          // Tokens are invalid, user should be logged out
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.refreshToken = null;
        } else if (isAuthError && !state.isAuthenticated) {
          // Only log out if we weren't already authenticated (initial check)
          state.isAuthenticated = false;
        } else if (isAuthError && state.isAuthenticated) {
          // If already authenticated but got auth error, the token refresh interceptor should handle it
          // Don't auto-logout - keep user authenticated and let interceptor retry
          if (__DEV__) {
            console.warn('getCurrentUser failed with auth error but user is authenticated. Token refresh should handle this.');
          }
        }
        // For network errors or other non-auth errors, keep authentication state
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Forgot password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
