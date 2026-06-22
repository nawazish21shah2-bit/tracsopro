// Authentication Redux Slice — tokens stored in Keychain only (securityManager)
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState, LoginForm, RegisterForm } from '../../types';
import { authApi } from '../../services/api/authApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { securityManager } from '../../utils/security';
import { superAdminService } from '../../services/superAdminService';

const initialState: AuthState = {
  user: null,
  tempUserId: null,
  tempEmail: null,
  isAuthenticated: false,
  isEmailVerified: false,
  isLoading: false,
  error: null,
  impersonationActive: false,
  impersonatorLabel: null,
  sessionReady: false,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data.user) {
        const userWithName = {
          ...response.data.user,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`.trim(),
        };
        return {
          user: userWithName,
          emailVerificationWarning: response.message || undefined,
        };
      }
      return rejectWithValue(response.message || 'Login failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterForm, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Registration failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ userId, otp }: { userId: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.verifyOTP(userId, otp);
      if (response.success && response.data.user) {
        const userWithName = {
          ...response.data.user,
          name: `${response.data.user.firstName} ${response.data.user.lastName}`.trim(),
        };
        return { user: userWithName };
      }
      return rejectWithValue(response.message || 'OTP verification failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'OTP verification failed');
    }
  }
);

export const resendOTP = createAsyncThunk(
  'auth/resendOTP',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await authApi.resendOTP(userId);
      if (response.success) {
        return response.message;
      }
      return rejectWithValue(response.message || 'Failed to resend OTP');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resend OTP');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      await securityManager.clearImpersonationBackup();
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'userData', 'userRole']);
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        const userWithName = {
          ...response.data,
          name: `${response.data.firstName} ${response.data.lastName}`.trim(),
        };
        return userWithName;
      }
      const isAuthError =
        response.message?.includes('Unauthorized') ||
        response.message?.includes('401') ||
        response.message?.includes('token');
      const tokensValid = await securityManager.areTokensValid();
      const shouldLogout = isAuthError && !tokensValid;
      return rejectWithValue({
        message: response.message || 'Failed to get user data',
        isAuthError,
        shouldLogout,
      });
    } catch (error: any) {
      const isAuthError =
        error.message?.includes('Unauthorized') ||
        error.message?.includes('401') ||
        error.response?.status === 401;
      const tokensValid = await securityManager.areTokensValid();
      const shouldLogout = isAuthError && !tokensValid;
      return rejectWithValue({
        message: error.message || 'Failed to get user data',
        isAuthError,
        shouldLogout,
      });
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(userData);
      if (response.success && response.data) {
        const userWithName = {
          ...response.data,
          name: `${response.data.firstName} ${response.data.lastName}`.trim(),
        };
        await securityManager.storeUserData(userWithName);
        return userWithName;
      }
      return rejectWithValue(response.message || 'Failed to update profile');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        return response.message;
      }
      return rejectWithValue(response.message || 'Failed to send reset email');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send reset email');
    }
  }
);

export const startImpersonation = createAsyncThunk(
  'auth/startImpersonation',
  async (targetUserId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentTokens = await securityManager.getTokens();
      if (!currentTokens || !state.auth.user) {
        return rejectWithValue('No active session to impersonate from');
      }
      await securityManager.storeImpersonationBackup({
        user: state.auth.user,
        tokens: currentTokens,
      });

      const result = await superAdminService.impersonateUser(targetUserId);
      const userWithName = {
        ...result.user,
        name: `${result.user.firstName} ${result.user.lastName}`.trim(),
      };

      await securityManager.storeTokens({
        accessToken: result.token,
        refreshToken: result.refreshToken,
        expiresAt: Date.now() + result.expiresIn * 1000,
        tokenType: 'Bearer',
      });
      await securityManager.storeUserData(userWithName);

      const impersonatorLabel =
        `${state.auth.user.firstName} ${state.auth.user.lastName}`.trim() ||
        state.auth.user.email;

      return { user: userWithName, impersonatorLabel };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Impersonation failed'
      );
    }
  }
);

export const exitImpersonation = createAsyncThunk(
  'auth/exitImpersonation',
  async (_, { rejectWithValue }) => {
    try {
      const backup = await securityManager.getImpersonationBackup();
      if (!backup) {
        return rejectWithValue('No impersonation session to restore');
      }
      await securityManager.storeTokens(backup.tokens);
      if (backup.user) {
        await securityManager.storeUserData(backup.user);
      }
      await securityManager.clearImpersonationBackup();
      return { user: backup.user };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to exit impersonation');
    }
  }
);

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
        name: `${action.payload.firstName} ${action.payload.lastName}`.trim(),
      };
      state.user = userWithName;
      state.isAuthenticated = true;
      state.sessionReady = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.tempUserId = null;
      state.tempEmail = null;
      state.isAuthenticated = false;
      state.isEmailVerified = false;
      state.error = null;
      state.impersonationActive = false;
      state.impersonatorLabel = null;
      state.sessionReady = false;
    },
    setTempUserData: (state, action: PayloadAction<{ userId: string; email: string }>) => {
      state.tempUserId = action.payload.userId;
      state.tempEmail = action.payload.email;
    },
    setSessionReady: (state, action: PayloadAction<boolean>) => {
      state.sessionReady = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isEmailVerified = Boolean(action.payload.user.isEmailVerified);
        state.sessionReady = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.isEmailVerified = true;
          state.sessionReady = true;
          state.tempUserId = null;
          state.tempEmail = null;
        } else {
          state.tempUserId = action.payload.userId;
          state.tempEmail = action.payload.email;
        }
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = {
          ...action.payload.user,
          isEmailVerified: true,
        };
        state.isAuthenticated = true;
        state.isEmailVerified = true;
        state.sessionReady = true;
        state.tempUserId = null;
        state.tempEmail = null;
        state.error = null;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

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
      });

    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.sessionReady = false;
        state.error = null;
        state.impersonationActive = false;
        state.impersonatorLabel = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isEmailVerified = Boolean(action.payload.isEmailVerified);
        state.sessionReady = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        const errorMessage =
          typeof payload === 'string' ? payload : payload?.message || 'Failed to get user data';
        const isAuthError = typeof payload === 'object' && payload?.isAuthError;
        const shouldLogout = typeof payload === 'object' && payload?.shouldLogout;
        state.error = errorMessage;
        if (shouldLogout) {
          state.isAuthenticated = false;
          state.user = null;
          state.sessionReady = false;
        } else if (isAuthError && !state.isAuthenticated) {
          state.isAuthenticated = false;
        }
      });

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

    builder
      .addCase(startImpersonation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startImpersonation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.sessionReady = true;
        state.impersonationActive = true;
        state.impersonatorLabel = action.payload.impersonatorLabel;
        state.error = null;
      })
      .addCase(startImpersonation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(exitImpersonation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(exitImpersonation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.sessionReady = true;
        state.impersonationActive = false;
        state.impersonatorLabel = null;
        state.error = null;
      })
      .addCase(exitImpersonation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading, setUser, clearAuth, setTempUserData, setSessionReady } =
  authSlice.actions;
export default authSlice.reducer;
