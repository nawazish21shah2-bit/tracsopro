// Auth Slice Tests
import authReducer, {
  loginUser,
  registerUser,
  logoutUser,
  clearError,
  setUser,
  clearAuth,
} from '../../store/slices/authSlice';
import { AuthState } from '../../types';
import { createMockFulfilledThunk, createMockRejectedThunk } from '../../utils/testUtils';

describe('Auth Slice', () => {
  const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle loginUser.pending', () => {
    const action = { type: loginUser.pending.type };
    const state = authReducer(initialState, action);
    
    expect(state.isLoading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle loginUser.fulfilled', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'guard' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const action = {
      type: loginUser.fulfilled.type,
      payload: {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    };

    const state = authReducer(initialState, action);
    
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('mock-token');
    expect(state.refreshToken).toBe('mock-refresh-token');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle loginUser.rejected', () => {
    const action = {
      type: loginUser.rejected.type,
      payload: 'Login failed',
    };

    const state = authReducer(initialState, action);
    
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Login failed');
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle registerUser.fulfilled', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'guard' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const action = {
      type: registerUser.fulfilled.type,
      payload: {
        user: mockUser,
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    };

    const state = authReducer(initialState, action);
    
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should handle logoutUser.fulfilled', () => {
    const stateWithUser: AuthState = {
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'guard',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };

    const action = {
      type: logoutUser.fulfilled.type,
      payload: null,
    };

    const state = authReducer(stateWithUser, action);
    
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
    expect(state.refreshToken).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle clearError', () => {
    const stateWithError: AuthState = {
      ...initialState,
      error: 'Some error',
    };

    const action = clearError();
    const state = authReducer(stateWithError, action);
    
    expect(state.error).toBe(null);
  });

  it('should handle setUser', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'guard' as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const action = setUser(mockUser);
    const state = authReducer(initialState, action);
    
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should handle clearAuth', () => {
    const stateWithUser: AuthState = {
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'guard',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };

    const action = clearAuth();
    const state = authReducer(stateWithUser, action);
    
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
    expect(state.refreshToken).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe(null);
  });
});
