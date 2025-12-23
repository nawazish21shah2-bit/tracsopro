/**
 * Registration Error Handler
 * Provides streamlined error handling for registration flows
 */

import { Alert } from 'react-native';
import { getActionableErrorMessage, isErrorType } from './errorHandler';

export interface RegistrationErrorOptions {
  error: any;
  navigation?: any;
  onLoginPress?: () => void;
}

/**
 * Display user-friendly registration error alert
 */
export function showRegistrationError({ error, navigation, onLoginPress }: RegistrationErrorOptions): void {
  const actionableError = getActionableErrorMessage(error);
  const errorMessage = actionableError.message;

  // Email already registered - show with login option
  if (isErrorType(error, ['already registered', 'email exists', 'duplicate email', 'login instead'])) {
    const buttons = [];
    
    if (navigation) {
      buttons.push({
        text: 'Login',
        onPress: () => navigation.navigate('Login'),
        style: 'default' as const,
      });
    } else if (onLoginPress) {
      buttons.push({
        text: 'Login',
        onPress: onLoginPress,
        style: 'default' as const,
      });
    }
    
    buttons.push({
      text: 'OK',
      style: 'cancel' as const,
    });

    Alert.alert(
      actionableError.title,
      errorMessage,
      buttons
    );
    return;
  }

  // Rate limiting
  if (isErrorType(error, ['rate limit', 'too many', 'throttle']) || actionableError.title === 'Rate Limit Exceeded') {
    Alert.alert(
      actionableError.title,
      errorMessage,
      [{ text: 'OK' }]
    );
    return;
  }

  // Network/Connection errors
  if (isErrorType(error, ['network', 'connection', 'server', 'timeout', 'econnrefused', 'etimedout'])) {
    Alert.alert(
      actionableError.title,
      errorMessage,
      [{ text: 'OK' }]
    );
    return;
  }

  // Default error display
  Alert.alert(
    actionableError.title,
    errorMessage || 'Failed to create account. Please try again.',
    [{ text: 'OK' }]
  );
}

