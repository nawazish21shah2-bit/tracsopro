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

describe('Auth Slice', () => {
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

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle loginUser.pending', () => {
    const action = { type: loginUser.pending.type };
    const state = authReducer(initialState, action);
    expect(state.isLoading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle loginUser.fulfilled without storing tokens in state', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'guard' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const action = {
      type: loginUser.fulfilled.type,
      payload: { user: mockUser },
    };

    const state = authReducer(initialState, action);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.sessionReady).toBe(true);
    expect(state.isLoading).toBe(false);
    expect((state as any).token).toBeUndefined();
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

  it('should handle registerUser.fulfilled with OTP pending', () => {
    const action = {
      type: registerUser.fulfilled.type,
      payload: { userId: 'u1', email: 'test@example.com' },
    };
    const state = authReducer(initialState, action);
    expect(state.tempUserId).toBe('u1');
    expect(state.tempEmail).toBe('test@example.com');
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle logoutUser.fulfilled', () => {
    const stateWithUser: AuthState = {
      ...initialState,
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'GUARD',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      sessionReady: true,
    };

    const action = { type: logoutUser.fulfilled.type, payload: null };
    const state = authReducer(stateWithUser, action);
    expect(state.user).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.sessionReady).toBe(false);
  });

  it('should handle clearError', () => {
    const stateWithError: AuthState = { ...initialState, error: 'Some error' };
    const state = authReducer(stateWithError, clearError());
    expect(state.error).toBe(null);
  });

  it('should handle clearAuth', () => {
    const stateWithUser: AuthState = {
      ...initialState,
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'GUARD',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      sessionReady: true,
    };
    const state = authReducer(stateWithUser, clearAuth());
    expect(state.user).toBe(null);
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle setUser', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'GUARD' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const state = authReducer(initialState, setUser(mockUser));
    expect(state.user?.name).toBe('John Doe');
    expect(state.isAuthenticated).toBe(true);
    expect(state.sessionReady).toBe(true);
  });
});
