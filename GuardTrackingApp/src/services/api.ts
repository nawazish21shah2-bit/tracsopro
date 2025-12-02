// Enhanced API Service for Guard Tracking App
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  AuthState, 
  Guard, 
  Location, 
  Incident, 
  Message, 
  Notification,
  ApiResponse,
  PaginatedResponse,
  LoginForm,
  RegisterForm,
  GuardForm,
  IncidentForm
} from '../types';
import { securityManager } from '../utils/security';
import { getApiBaseUrl, getConfigInfo } from '../config/apiConfig';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private isLoggingOut: boolean = false;

  constructor() {
    // Get API URL from centralized configuration
    // See src/config/apiConfig.ts to configure production URLs
    this.baseURL = getApiBaseUrl();
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (__DEV__) {
      const configInfo = getConfigInfo();
      console.log(`🌐 API Service initialized:`, configInfo);
    }

    this.setupInterceptors();
  }

  // Lightweight raw helpers for feature modules
  public getRaw<T = any>(path: string, config?: any) {
    return this.api.get<T>(path, config);
  }

  public postRaw<T = any>(path: string, data?: any, config?: any) {
    return this.api.post<T>(path, data, config);
  }

  public putRaw<T = any>(path: string, data?: any, config?: any) {
    return this.api.put<T>(path, data, config);
  }

  public patchRaw<T = any>(path: string, data?: any, config?: any) {
    return this.api.patch<T>(path, data, config);
  }

  public deleteRaw<T = any>(path: string, config?: any) {
    return this.api.delete<T>(path, config);
  }

  // Public convenience methods that wrap the axios instance
  // These methods include authentication headers automatically via interceptors
  public get<T = any>(path: string, config?: any) {
    return this.api.get<T>(path, config);
  }

  public post<T = any>(path: string, data?: any, config?: any) {
    return this.api.post<T>(path, data, config);
  }

  public put<T = any>(path: string, data?: any, config?: any) {
    return this.api.put<T>(path, data, config);
  }

  public patch<T = any>(path: string, data?: any, config?: any) {
    return this.api.patch<T>(path, data, config);
  }

  public delete<T = any>(path: string, config?: any) {
    return this.api.delete<T>(path, config);
  }

  private setupInterceptors() {
    // List of public endpoints that don't require authentication
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-otp',
      '/auth/resend-otp',
      '/auth/refresh',
    ];

    // Enhanced network request tracking
    const networkRequests = new Map<string, { startTime: number; url: string; method: string }>();

    // Request interceptor to add auth token and logging
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const isPublicEndpoint = publicEndpoints.some(endpoint => 
            config.url?.includes(endpoint)
          );

          // Generate unique request ID for tracking
          const requestId = securityManager.generateSessionId();
          config.headers['X-Request-ID'] = requestId;

          // Track request start time for performance monitoring
          const startTime = Date.now();
          networkRequests.set(requestId, {
            startTime,
            url: config.url || '',
            method: config.method?.toUpperCase() || 'GET',
          });

          const tokens = await securityManager.getTokens();
          if (tokens && tokens.accessToken) {
            config.headers.Authorization = `${tokens.tokenType || 'Bearer'} ${tokens.accessToken}`;
            if (__DEV__) {
              console.log(`🔑 Token found for ${config.method?.toUpperCase()} ${config.url}`, {
                tokenLength: tokens.accessToken.length,
                expiresAt: new Date(tokens.expiresAt).toISOString(),
                isExpired: tokens.expiresAt <= Date.now()
              });
            }
          } else if (!isPublicEndpoint && __DEV__) {
            // Only log missing token warning for protected endpoints
            console.log(`⚠️ No token found for ${config.method?.toUpperCase()} ${config.url} (protected endpoint)`);
          }
          
          if (__DEV__) {
            // Enhanced network logging with full details
            const fullUrl = `${this.baseURL}${config.url}`;
            const requestLog: any = {
              '📤 REQUEST': `${config.method?.toUpperCase()} ${fullUrl}`,
              'Request ID': requestId,
              'Headers': {
                ...Object.fromEntries(
                  Object.entries(config.headers).filter(([key]) => 
                    !['Authorization'].includes(key) // Hide sensitive headers in log
                  )
                ),
                'Authorization': tokens?.accessToken ? `Bearer ${tokens.accessToken.substring(0, 20)}...` : 'None',
              },
            };

            // Log request body for POST/PUT/PATCH (excluding sensitive data)
            if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
              const isLoginRequest = config.url?.includes('/auth/login');
              if (isLoginRequest) {
                // Mask password in login requests
                const safeData = { ...config.data };
                if (safeData.password) safeData.password = '***';
                if (safeData.email) safeData.email = safeData.email.substring(0, 3) + '***';
                requestLog['Body'] = safeData;
              } else {
                requestLog['Body'] = typeof config.data === 'string' 
                  ? JSON.parse(config.data || '{}') 
                  : config.data;
              }
            }

            // Only log request for public endpoints or when token exists (to reduce noise)
            if (isPublicEndpoint || (tokens && tokens.accessToken)) {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log(JSON.stringify(requestLog, null, 2));
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
          }
        } catch (error) {
          console.error('Request interceptor error:', error);
        }
        
        return config;
      },
      (error: AxiosError) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor to handle token refresh and errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (__DEV__) {
          const requestId = response.config.headers['X-Request-ID'] as string;
          const requestInfo = networkRequests.get(requestId);
          const duration = requestInfo ? Date.now() - requestInfo.startTime : 0;
          networkRequests.delete(requestId);

          const fullUrl = `${this.baseURL}${response.config.url}`;
          const responseLog: any = {
            '📥 RESPONSE': `${response.status} ${response.config.method?.toUpperCase()} ${fullUrl}`,
            'Duration': `${duration}ms`,
            'Status': `${response.status} ${response.statusText}`,
            'Headers': response.headers,
          };

          // Log response data (truncate large responses)
          if (response.data) {
            const dataStr = JSON.stringify(response.data);
            if (dataStr.length > 1000) {
              responseLog['Body'] = `${dataStr.substring(0, 1000)}... (truncated, ${dataStr.length} chars)`;
            } else {
              responseLog['Body'] = response.data;
            }
          }

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(JSON.stringify(responseLog, null, 2));
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        // Handle 401 Unauthorized with token refresh
        if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
          (originalRequest as any)._retry = true;
          
          if (__DEV__) {
            console.log(`🔄 401 error for ${originalRequest.method?.toUpperCase()} ${originalRequest.url}, attempting token refresh (retry count: ${this.retryCount})`);
          }
          
          // Prevent infinite refresh loops by checking retry count
          if (this.retryCount >= this.maxRetries) {
            console.warn('⚠️ Max refresh retries reached, clearing tokens');
            // Don't auto-logout immediately - let the user handle it
            this.retryCount = 0;
            return Promise.reject(this.handleError(error));
          }
          
          try {
            const tokens = await securityManager.getTokens();
            if (tokens?.refreshToken) {
              this.retryCount++;
              const response = await this.refreshAuthToken(tokens.refreshToken);
              const newTokens = {
                accessToken: response.data.token,
                refreshToken: (response.data as any).refreshToken || tokens.refreshToken,
                expiresAt: Date.now() + ((response.data as any).expiresIn * 1000),
                tokenType: 'Bearer',
              };
              
              await securityManager.storeTokens(newTokens);
              this.retryCount = 0; // Reset on success
              if (originalRequest) {
                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                return this.api(originalRequest);
              }
            } else {
              // No refresh token available, clear auth state
              if (__DEV__) {
                console.log('❌ No refresh token available, request will fail');
              }
              return Promise.reject(this.handleError(error));
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.retryCount = 0;
            // Don't auto-logout on refresh failure - let the app handle it
            return Promise.reject(this.handleError(refreshError as AxiosError));
          }
        }
        
        // Handle network errors with retry logic
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
          
          await new Promise<void>(resolve => setTimeout(resolve, delay));
          if (originalRequest) {
            return this.api(originalRequest);
          }
        }
        
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private handleError(error: AxiosError): Error {
    let message = 'An unexpected error occurred';
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 400:
          message = data?.message || 'Bad request';
          break;
        case 401:
          message = 'Unauthorized access';
          break;
        case 403:
          message = 'Access forbidden';
          break;
        case 404:
          message = 'Resource not found';
          break;
        case 422:
          message = data?.message || 'Validation error';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Internal server error';
          break;
        case 502:
        case 503:
        case 504:
          message = 'Service temporarily unavailable';
          break;
        default:
          message = data?.message || `Server error (${status})`;
      }
    } else if (error.request) {
      // Network error - provide more helpful message
      if (__DEV__) {
        console.error('🌐 Network Error Details:', {
          url: error.config?.url,
          baseURL: this.baseURL,
          method: error.config?.method,
          message: error.message
        });
      }
      message = `Network error. Please check your connection and ensure the backend server is running at ${this.baseURL}`;
    } else {
      // Other error
      message = error.message || 'An unexpected error occurred';
    }
    
    const customError = new Error(message);
    (customError as any).status = error.response?.status;
    (customError as any).data = error.response?.data;
    
    return customError;
  }

  // Authentication Methods
  async login(credentials: LoginForm): Promise<ApiResponse<AuthState>> {
    try {
      // Sanitize input
      const sanitizedCredentials = {
        email: securityManager.sanitizeInput(credentials.email),
        password: credentials.password, // Don't sanitize password as it might contain special chars
      };

      const response = await this.api.post('/auth/login', sanitizedCredentials);
      const { token, refreshToken, user, expiresIn } = response.data.data;
      
      // Store tokens securely
      const tokenData = {
        accessToken: token,
        refreshToken: refreshToken,
        expiresAt: Date.now() + (expiresIn * 1000),
        tokenType: 'Bearer',
      };
      
      await securityManager.storeTokens(tokenData);
      await securityManager.storeUserData(user);
      
      // Verify tokens were stored correctly
      if (__DEV__) {
        const storedTokens = await securityManager.getTokens();
        console.log('🔍 Verifying token storage:', {
          stored: !!storedTokens,
          tokenMatch: storedTokens?.accessToken === token,
          expiresAt: storedTokens ? new Date(storedTokens.expiresAt).toISOString() : 'N/A'
        });
      }
      
      return {
        success: true,
        data: {
          user,
          token,
          refreshToken,
          tempUserId: null,
          tempEmail: null,
          isAuthenticated: true,
          isEmailVerified: true,
          isLoading: false,
          error: null
        }
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as AuthState,
        message: error.message || 'Login failed',
        errors: error.data?.errors
      };
    }
  }

  // Admin Shift Management (simple create for scheduling screen)
  async createAdminShift(data: {
    guardId: string;
    locationName: string;
    locationAddress: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    description?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/admin/shifts', data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to create shift',
      };
    }
  }

  // Admin Client Management (for dropdowns, etc.)
  async getAdminClients(params: { page?: number; limit?: number; search?: string } = {}): Promise<ApiResponse<any>> {
    try {
      const { page = 1, limit = 50, search } = params;
      const query = new URLSearchParams();
      query.append('page', String(page));
      query.append('limit', String(limit));
      if (search) query.append('search', search);

      const response = await this.api.get(`/admin/clients?${query.toString()}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch clients',
      };
    }
  }

  // Admin Site Management Methods
  async getAdminSites(params: {
    page?: number;
    limit?: number;
    clientId?: string;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<ApiResponse<any>> {
    try {
      const { page = 1, limit = 20, clientId, isActive, search } = params;
      const query = new URLSearchParams();
      query.append('page', String(page));
      query.append('limit', String(limit));
      if (clientId) query.append('clientId', clientId);
      if (typeof isActive === 'boolean') query.append('isActive', String(isActive));
      if (search) query.append('search', search);

      const response = await this.api.get(`/admin/sites?${query.toString()}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch sites',
      };
    }
  }

  async createAdminSite(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/admin/sites', data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to create site',
      };
    }
  }

  async updateAdminSite(id: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/admin/sites/${id}`, data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update site',
      };
    }
  }

  async deleteAdminSite(id: string): Promise<ApiResponse<null>> {
    try {
      await this.api.delete(`/admin/sites/${id}`);
      return {
        success: true,
        data: null,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to delete site',
      };
    }
  }

  async register(userData: RegisterForm): Promise<ApiResponse<any>> {
    try {
      if (__DEV__) {
        console.log('📝 Attempting registration:', {
          email: userData.email,
          role: userData.role,
          baseURL: this.baseURL,
        });
      }
      
      const response = await this.api.post('/auth/register', userData);
      
      // Handle different response formats
      const responseData = response.data.data || response.data;
      
      if (__DEV__) {
        console.log('✅ Registration response:', JSON.stringify(responseData, null, 2));
      }
      
      return {
        success: true,
        data: responseData,
        message: responseData?.message || 'Registration successful'
      };
    } catch (error: any) {
      // Enhanced error logging
      if (__DEV__) {
        console.error('❌ Registration error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
          request: error.request ? 'Request sent but no response' : 'No request sent',
          baseURL: this.baseURL,
          url: error.config?.url,
        });
      }
      
      // Handle network errors (no response from server)
      if (!error.response) {
        const errorCode = error.code;
        const errorMessage = error.message || '';
        
        let userFriendlyMessage = 'Registration failed. ';
        
        if (errorCode === 'ECONNREFUSED') {
          userFriendlyMessage += `Cannot connect to backend server at ${this.baseURL}. Please ensure the backend server is running.`;
        } else if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNABORTED') {
          userFriendlyMessage += 'Request timed out. The server may be slow or unresponsive. Please try again.';
        } else if (errorMessage.includes('Network Error') || errorMessage.includes('network')) {
          userFriendlyMessage += 'Network error. Please check your internet connection and ensure the backend server is running.';
        } else {
          userFriendlyMessage += 'No response from server. Please check if the backend server is running and accessible.';
        }
        
        return {
          success: false,
          data: null,
          message: userFriendlyMessage,
          errors: []
        };
      }
      
      // Extract detailed error information from response
      const errorData = error.response?.data;
      const statusCode = error.response?.status;
      
      let errorMessage = errorData?.message || 
                        errorData?.error || 
                        error.message || 
                        'Registration failed';
      
      // Add status code context for 500 errors
      if (statusCode === 500) {
        errorMessage += ' (Server Error). Please check backend logs for details.';
      }
      
      const errors = errorData?.errors || [];
      
      return {
        success: false,
        data: null,
        message: errorMessage,
        errors: errors
      };
    }
  }

  async verifyOTP(userId: string, otp: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/auth/verify-otp', { userId, otp });
      const { token, refreshToken, user } = response.data.data;
      
      // Store tokens after successful OTP verification
      await securityManager.storeTokens({
        accessToken: token,
        refreshToken: refreshToken,
        expiresAt: Date.now() + (1800 * 1000), // 30 minutes
        tokenType: 'Bearer'
      });
      await securityManager.storeUserData(user);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'OTP verification failed',
        errors: error.response?.data?.errors
      };
    }
  }

  async resendOTP(userId: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.api.post('/auth/resend-otp', { userId });
      return {
        success: true,
        data: null,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to resend OTP'
      };
    }
  }

  async refreshAuthToken(refreshToken: string): Promise<AxiosResponse<{ token: string }>> {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async logout(): Promise<void> {
    if (__DEV__) {
      console.log('🚪 Logout called');
      console.trace('Logout stack trace');
    }
    
    // Prevent multiple simultaneous logout calls
    if (this.isLoggingOut) {
      if (__DEV__) {
        console.log('⏳ Logout already in progress, skipping');
      }
      return;
    }
    
    this.isLoggingOut = true;
    
    try {
      // Try to call logout endpoint, but don't fail if it doesn't work
      await this.api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors - the important thing is clearing local tokens
      console.log('Logout endpoint call failed (expected if tokens are invalid):', (error as any).response?.status);
    } finally {
      // Always clear tokens regardless of backend response
      await securityManager.clearTokens();
      this.retryCount = 0; // Reset retry count
      this.isLoggingOut = false; // Reset logout flag
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.api.post('/auth/forgot-password', { email });
      return {
        success: true,
        data: null,
        message: response.data.message || 'Password reset OTP sent to your email'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to send reset email'
      };
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<ApiResponse<null>> {
    try {
      const response = await this.api.post('/auth/reset-password', { email, otp, newPassword });
      return {
        success: true,
        data: null,
        message: response.data.message || 'Password reset successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to reset password'
      };
    }
  }

  // User Management Methods
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      // In development mode, check if we have stored user data first
      if (__DEV__) {
        const storedUser = await securityManager.getUserData();
        if (storedUser) {
          return {
            success: true,
            data: storedUser
          };
        }
      }

      const response = await this.api.get('/auth/me');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      // In development, if there's a network error, just return failure without stored user
      if (__DEV__ && (error.message?.includes('Network Error') || error.message?.includes('ECONNREFUSED'))) {
        return {
          success: false,
          data: {} as User,
          message: 'No backend server available'
        };
      }
      
      return {
        success: false,
        data: {} as User,
        message: error.response?.data?.message || 'Failed to get user data'
      };
    }
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.put('/auth/profile', userData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as User,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  }

  // Admin User Management Methods
  async getAdminUsers(params: {
    page?: number;
    limit?: number;
    role?: 'ADMIN' | 'GUARD' | 'CLIENT' | 'SUPER_ADMIN';
    search?: string;
    isActive?: boolean;
  } = {}): Promise<ApiResponse<any>> {
    try {
      const { page = 1, limit = 50, role, search, isActive } = params;
      const query = new URLSearchParams();
      query.append('page', String(page));
      query.append('limit', String(limit));
      if (role) query.append('role', role);
      if (search) query.append('search', search);
      if (typeof isActive === 'boolean') query.append('isActive', String(isActive));

      const response = await this.api.get(`/admin/users?${query.toString()}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch users',
      };
    }
  }

  async updateAdminUserStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.patch(`/admin/users/${id}/status`, { isActive });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update user status',
      };
    }
  }

  async updateAdminUser(id: string, data: Partial<{ firstName: string; lastName: string; email: string; role: 'ADMIN' | 'GUARD' | 'CLIENT' | 'SUPER_ADMIN'; }>): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/admin/users/${id}`, data);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update user',
      };
    }
  }

  async deleteAdminUser(id: string): Promise<ApiResponse<null>> {
    try {
      await this.api.delete(`/admin/users/${id}`);
      return {
        success: true,
        data: null,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to delete user',
      };
    }
  }

  // Guard Management Methods
  async getGuards(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Guard>>> {
    try {
      const response = await this.api.get(`/guards?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as PaginatedResponse<Guard>,
        message: error.response?.data?.message || 'Failed to fetch guards'
      };
    }
  }

  async getGuard(id: string): Promise<ApiResponse<Guard>> {
    try {
      const response = await this.api.get(`/guards/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as Guard,
        message: error.response?.data?.message || 'Failed to fetch guard'
      };
    }
  }

  async createGuard(guardData: GuardForm): Promise<ApiResponse<Guard>> {
    try {
      const response = await this.api.post('/guards', guardData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as Guard,
        message: error.response?.data?.message || 'Failed to create guard'
      };
    }
  }

  async updateGuard(id: string, guardData: Partial<GuardForm>): Promise<ApiResponse<Guard>> {
    try {
      const response = await this.api.put(`/guards/${id}`, guardData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as Guard,
        message: error.response?.data?.message || 'Failed to update guard'
      };
    }
  }

  async deleteGuard(id: string): Promise<ApiResponse<null>> {
    try {
      await this.api.delete(`/guards/${id}`);
      return {
        success: true,
        data: null
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to delete guard'
      };
    }
  }

  // Location Management Methods
  async getLocations(): Promise<ApiResponse<Location[]>> {
    try {
      const response = await this.api.get('/locations');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch locations'
      };
    }
  }

  async updateLocation(locationData: Partial<Location>): Promise<ApiResponse<Location>> {
    try {
      const response = await this.api.put(`/locations/${locationData.id}`, locationData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as Location,
        message: error.response?.data?.message || 'Failed to update location'
      };
    }
  }

  // Tracking Methods
  async sendLocationUpdate(trackingData: {
    guardId: string;
    coordinates: { latitude: number; longitude: number };
    accuracy: number;
    batteryLevel: number;
  }): Promise<ApiResponse<null>> {
    try {
      await this.api.post('/tracking/location', trackingData);
      return {
        success: true,
        data: null
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update location'
      };
    }
  }

  async getTrackingHistory(guardId: string, startDate?: Date, endDate?: Date): Promise<ApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await this.api.get(`/tracking/${guardId}?${params.toString()}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch tracking history'
      };
    }
  }

  // Incident Management Methods
  async getIncidents(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Incident>>> {
    try {
      const response = await this.api.get(`/incidents?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as PaginatedResponse<Incident>,
        message: error.response?.data?.message || 'Failed to fetch incidents'
      };
    }
  }

  async createIncident(incidentData: IncidentForm): Promise<ApiResponse<Incident>> {
    try {
      const response = await this.api.post('/incidents', incidentData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as Incident,
        message: error.response?.data?.message || 'Failed to create incident'
      };
    }
  }

  async updateIncident(id: string, incidentData: Partial<IncidentForm>): Promise<ApiResponse<Incident>> {
    try {
      const response = await this.api.put(`/incidents/${id}`, incidentData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as Incident,
        message: error.response?.data?.message || 'Failed to update incident'
      };
    }
  }

  // Message Methods
  async getMessages(conversationId?: string): Promise<ApiResponse<Message[]>> {
    try {
      const url = conversationId ? `/messages?conversationId=${conversationId}` : '/messages';
      const response = await this.api.get(url);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch messages'
      };
    }
  }

  async sendMessage(messageData: {
    recipientId: string;
    content: string;
    type: string;
    attachments?: any[];
  }): Promise<ApiResponse<Message>> {
    try {
      const response = await this.api.post('/messages', messageData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as Message,
        message: error.response?.data?.message || 'Failed to send message'
      };
    }
  }

  // Notification Methods
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    try {
      const response = await this.api.get('/notifications');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch notifications'
      };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<null>> {
    try {
      await this.api.put(`/notifications/${notificationId}/read`);
      return {
        success: true,
        data: null
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to mark notification as read'
      };
    }
  }

  // Client Dashboard Methods
  async getClientDashboardStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/clients/dashboard/stats');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch dashboard stats'
      };
    }
  }

  async getClientGuards(page: number = 1, limit: number = 50): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/clients/my-guards?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch guards'
      };
    }
  }

  async getClientReports(page: number = 1, limit: number = 50): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/clients/my-reports?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch reports'
      };
    }
  }

  async getClientSites(page: number = 1, limit: number = 50): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/clients/my-sites?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      // Fallback to mock data when backend is not available
      console.log('Backend not available, using mock sites data');
      
      const mockSites = [
        {
          id: 'site_1',
          name: 'Central Office Building',
          address: '123 Business District, New York, NY 10001',
          latitude: 40.7589,
          longitude: -73.9851,
          description: 'Main corporate office building requiring 24/7 security coverage',
          requirements: 'Professional appearance, valid security license, experience with access control systems',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          client: {
            id: 'client_1',
            user: {
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@company.com'
            }
          }
        },
        {
          id: 'site_2',
          name: 'Warehouse Distribution Center',
          address: '456 Industrial Ave, Brooklyn, NY 11201',
          latitude: 40.7505,
          longitude: -73.9934,
          description: 'Large warehouse facility with multiple loading docks and inventory areas',
          requirements: 'Physical fitness required, forklift certification preferred, night shift availability',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          client: {
            id: 'client_1',
            user: {
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@company.com'
            }
          }
        },
        {
          id: 'site_3',
          name: 'Retail Shopping Plaza',
          address: '789 Commerce St, Manhattan, NY 10014',
          latitude: 40.7614,
          longitude: -73.9776,
          description: 'Multi-tenant retail plaza with various shops and restaurants',
          requirements: 'Customer service skills, crowd management experience, weekend availability',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          client: {
            id: 'client_1',
            user: {
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@company.com'
            }
          }
        }
      ];

      return {
        success: true,
        data: {
          sites: mockSites,
          pagination: {
            page: 1,
            limit: 50,
            total: mockSites.length,
            pages: 1
          }
        }
      };
    }
  }

  async getClientNotifications(page: number = 1, limit: number = 50): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/clients/my-notifications?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch notifications'
      };
    }
  }

  async getClientProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/clients/my-profile');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  }

  async updateClientProfile(data: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put('/clients/profile', data);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  }

  async updateGuardProfile(data: {
    experience?: string;
    profilePictureUrl?: string | null;
    idCardFrontUrl?: string | null;
    idCardBackUrl?: string | null;
    certificationUrls?: string[];
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put('/guards/profile', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Guard profile updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update guard profile'
      };
    }
  }

  async applyForShift(shiftPostingId: string, message?: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/shift-postings/${shiftPostingId}/apply`, { message });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Application submitted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to submit application'
      };
    }
  }

  async getUpcomingShifts(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/shifts/upcoming');
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Shifts fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch upcoming shifts'
      };
    }
  }

  async triggerEmergencyAlert(data: {
    type: 'PANIC' | 'MEDICAL' | 'SECURITY' | 'FIRE' | 'CUSTOM';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      address?: string;
    };
    message?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/emergency/alert', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Emergency alert sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to send emergency alert'
      };
    }
  }

  async checkInToShift(shiftId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/shifts/${shiftId}/check-in`, { location });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Successfully checked in to shift'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to check in'
      };
    }
  }

  async checkOutFromShift(shiftId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  }, notes?: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/shifts/${shiftId}/check-out`, { location, notes });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Successfully checked out from shift'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to check out'
      };
    }
  }

  async getShiftById(shiftId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/shifts/${shiftId}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Shift details fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch shift details'
      };
    }
  }

  async getAvailableShiftPostings(page: number = 1, limit: number = 10, search?: string): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (search) params.append('search', search);
      
      const response = await this.api.get(`/shift-postings/available?${params.toString()}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Shift postings fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: { shiftPostings: [], pagination: { page, limit, total: 0, pages: 0 } },
        message: error.response?.data?.message || 'Failed to fetch shift postings'
      };
    }
  }

  async getShiftPostingById(shiftPostingId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/shift-postings/${shiftPostingId}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Shift posting details fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch shift posting details'
      };
    }
  }

  async getSiteById(siteId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/sites/${siteId}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Site details fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch site details'
      };
    }
  }

  // Location Tracking Methods
  async recordLocation(guardId: string, locationData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/tracking/location', {
        guardId,
        ...locationData
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to record location'
      };
    }
  }

  async recordGeofenceEvent(eventData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/tracking/geofence-event', eventData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to record geofence event'
      };
    }
  }

  async getLocationHistory(guardId: string, startDate?: string, endDate?: string): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await this.api.get(`/tracking/history/${guardId}?${params.toString()}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch location history'
      };
    }
  }

  async getLiveLocations(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/tracking/live-locations');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch live locations'
      };
    }
  }

  // Admin Methods
  async getAdminDashboardStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/admin/dashboard/stats');
      return {
        success: true,
        data: response.data.data,
        message: 'Dashboard statistics fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch dashboard statistics'
      };
    }
  }

  async getAdminRecentActivity(limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/admin/dashboard/activity?limit=${limit}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Recent activity fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch recent activity'
      };
    }
  }

  async getAdminCompany(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/admin/company');
      return {
        success: true,
        data: response.data.data,
        message: 'Company information fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch company information'
      };
    }
  }

  async getAdminSubscription(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/admin/subscription');
      return {
        success: true,
        data: response.data.data,
        message: 'Subscription information fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch subscription information'
      };
    }
  }

  // Admin Incident Reports Methods
  async getAllIncidentReports(params: {
    page?: number;
    limit?: number;
    guardId?: string;
    reportType?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ApiResponse<any>> {
    try {
      const { page = 1, limit = 10, guardId, reportType, startDate, endDate } = params;
      const query = new URLSearchParams();
      query.append('page', String(page));
      query.append('limit', String(limit));
      if (guardId) query.append('guardId', guardId);
      if (reportType) query.append('reportType', reportType);
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const response = await this.api.get(`/incident-reports/admin/all?${query.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Incident reports fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch incident reports'
      };
    }
  }

  async getIncidentReportStats(params: {
    startDate?: string;
    endDate?: string;
    guardId?: string;
  } = {}): Promise<ApiResponse<any>> {
    try {
      const { startDate, endDate, guardId } = params;
      const query = new URLSearchParams();
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);
      if (guardId) query.append('guardId', guardId);

      const response = await this.api.get(`/incident-reports/admin/stats?${query.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Incident report statistics fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch incident report statistics'
      };
    }
  }

  async updateIncidentReport(id: string, updateData: {
    status?: string;
    reviewNotes?: string;
    [key: string]: any;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/incident-reports/${id}`, updateData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Incident report updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update incident report'
      };
    }
  }

  // Client report response
  async respondToReport(reportId: string, status: string, responseNotes?: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/clients/reports/${reportId}/respond`, {
        status,
        responseNotes,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Report response saved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to respond to report'
      };
    }
  }

  // Chat Methods
  async getChatRooms(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/chat');
      return {
        success: true,
        data: response.data.data,
        message: 'Chat rooms fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch chat rooms'
      };
    }
  }

  async getChatMessages(chatId: string, page: number = 1, limit: number = 50): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Messages fetched successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch messages'
      };
    }
  }

  async sendChatMessage(chatId: string, content: string, messageType: 'text' | 'image' | 'file' | 'location' = 'text'): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/chat/${chatId}/messages`, {
        content,
        messageType,
      });
      return {
        success: true,
        data: response.data.data,
        message: 'Message sent successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to send message'
      };
    }
  }

  async markChatMessagesAsRead(chatId: string, messageIds: string[]): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/chat/${chatId}/read`, {
        messageIds,
      });
      return {
        success: true,
        data: response.data.data,
        message: 'Messages marked as read'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to mark messages as read'
      };
    }
  }

  async createChat(type: 'direct' | 'group' | 'team', participantIds: string[], name?: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/chat', {
        type,
        participantIds,
        name,
      });
      return {
        success: true,
        data: response.data.data,
        message: 'Chat created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to create chat'
      };
    }
  }

  async searchChats(query: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/chat/search?q=${encodeURIComponent(query)}`);
      return {
        success: true,
        data: response.data.data,
        message: 'Search completed successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to search chats'
      };
    }
  }
}

export default new ApiService();

