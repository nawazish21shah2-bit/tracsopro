// Login Screen Tests — smoke tests aligned with current UI
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../utils/testUtils';
import LoginScreen from '../LoginScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form fields and submit button', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

    expect(getByPlaceholderText('Email Address')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('updates email and password inputs', () => {
    const { getByPlaceholderText } = renderWithProviders(<LoginScreen />);

    const emailInput = getByPlaceholderText('Email Address');
    const passwordInput = getByPlaceholderText('Password');

    fireEvent.changeText(emailInput, 'guard@test.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('guard@test.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('navigates to forgot password screen', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);

    fireEvent.press(getByText(/forgot password/i));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('navigates to role selection for registration', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);

    fireEvent.press(getByText(/register now/i));
    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });
});
