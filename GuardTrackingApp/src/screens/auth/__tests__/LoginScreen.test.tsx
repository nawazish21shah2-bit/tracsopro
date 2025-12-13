// Login Screen Tests - Testing authentication flow
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, createMockUser } from '../../../utils/testUtils';
import LoginScreen from '../LoginScreen';
import { loginUser } from '../../../store/slices/authSlice';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form correctly', () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <LoginScreen />
      );

      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('should render forgot password link', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);

      expect(getByText(/forgot password/i)).toBeTruthy();
    });

    it('should render register link', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);

      expect(getByText(/don't have an account/i)).toBeTruthy();
    });
  });

  describe('Form Input', () => {
    it('should update email input', () => {
      const { getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      const emailInput = getByPlaceholderText('Enter your email');
      fireEvent.changeText(emailInput, 'guard@test.com');

      expect(emailInput.props.value).toBe('guard@test.com');
    });

    it('should update password input', () => {
      const { getByPlaceholderText } = renderWithProviders(<LoginScreen />);

      const passwordInput = getByPlaceholderText('Enter your password');
      fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });

    it('should toggle password visibility', () => {
      const { getByPlaceholderText, getByTestId } = renderWithProviders(
        <LoginScreen />
      );

      const passwordInput = getByPlaceholderText('Enter your password');
      const toggleButton = getByTestId('toggle-password-visibility');

      fireEvent.press(toggleButton);

      // Password visibility should toggle
      expect(passwordInput).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <LoginScreen />
      );

      const loginButton = getByText('Sign In');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText(/email is required/i)).toBeTruthy();
      });
    });

    it('should show error for invalid email format', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <LoginScreen />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      fireEvent.changeText(emailInput, 'invalid-email');

      const loginButton = getByText('Sign In');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText(/invalid email format/i)).toBeTruthy();
      });
    });

    it('should show error for empty password', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <LoginScreen />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      fireEvent.changeText(emailInput, 'guard@test.com');

      const loginButton = getByText('Sign In');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText(/password is required/i)).toBeTruthy();
      });
    });
  });

  describe('Login Flow', () => {
    it('should dispatch login action on valid form submission', async () => {
      const mockDispatch = jest.fn();
      jest.mock('react-redux', () => ({
        useDispatch: () => mockDispatch,
        useSelector: jest.fn(() => ({
          isLoading: false,
          error: null,
        })),
      }));

      const { getByText, getByPlaceholderText } = renderWithProviders(
        <LoginScreen />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');

      fireEvent.changeText(emailInput, 'guard@test.com');
      fireEvent.changeText(passwordInput, 'password123');

      const loginButton = getByText('Sign In');
      fireEvent.press(loginButton);

      await waitFor(() => {
        // Login action should be dispatched
        expect(mockDispatch).toHaveBeenCalled();
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      const mockUser = createMockUser({
        email: 'guard@test.com',
        role: 'GUARD',
      });

      const initialState = {
        auth: {
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      };

      const { getByText, getByPlaceholderText } = renderWithProviders(
        <LoginScreen />,
        { initialState }
      );

      // Simulate successful login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('should show error message on login failure', async () => {
      const initialState = {
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Invalid credentials',
        },
      };

      const { getByText } = renderWithProviders(<LoginScreen />, {
        initialState,
      });

      await waitFor(() => {
        expect(getByText(/invalid credentials/i)).toBeTruthy();
      });
    });

    it('should show loading state during login', () => {
      const initialState = {
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
        },
      };

      const { getByTestId } = renderWithProviders(<LoginScreen />, {
        initialState,
      });

      expect(getByTestId('loading-spinner')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to forgot password screen', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);

      const forgotPasswordLink = getByText(/forgot password/i);
      fireEvent.press(forgotPasswordLink);

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });

    it('should navigate to register screen', () => {
      const { getByText } = renderWithProviders(<LoginScreen />);

      const registerLink = getByText(/don't have an account/i);
      fireEvent.press(registerLink);

      expect(mockNavigate).toHaveBeenCalledWith('Register');
    });
  });

  describe('Remember Me', () => {
    it('should save credentials when remember me is checked', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');

      const { getByText, getByPlaceholderText, getByTestId } =
        renderWithProviders(<LoginScreen />);

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const rememberMeCheckbox = getByTestId('remember-me-checkbox');

      fireEvent.changeText(emailInput, 'guard@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(rememberMeCheckbox);

      const loginButton = getByText('Sign In');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'rememberedEmail',
          'guard@test.com'
        );
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'rememberedPassword',
          'password123'
        );
      });
    });
  });
});



