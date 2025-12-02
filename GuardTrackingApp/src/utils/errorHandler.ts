import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  action?: string;
}

export class ErrorHandler {
  private static errorHistory: AppError[] = [];
  private static maxHistorySize = 50;

  /**
   * Handle and log errors with user-friendly messages
   */
  static handleError(error: any, action?: string, showAlert: boolean = true): AppError {
    const appError: AppError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: this.getUserFriendlyMessage(error),
      details: error,
      timestamp: new Date().toISOString(),
      action,
    };

    // Add to error history
    this.addToHistory(appError);

    // Log to console in development
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('App Error:', appError);
    }

    // Show user alert if requested
    if (showAlert) {
      this.showErrorAlert(appError);
    }

    return appError;
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private static getUserFriendlyMessage(error: any): string {
    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error.response?.status === 404) {
      return 'The requested information could not be found.';
    }
    
    if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network')) {
      return 'Network connection error. Please check your internet connection.';
    }
    
    if (error.code === 'TIMEOUT') {
      return 'Request timed out. Please try again.';
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Show error alert to user
   */
  private static showErrorAlert(error: AppError) {
    Alert.alert(
      'Error',
      error.message,
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Report Issue',
          style: 'destructive',
          onPress: () => this.reportError(error),
        },
      ]
    );
  }

  /**
   * Add error to history
   */
  private static addToHistory(error: AppError) {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get error history
   */
  static getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  static clearErrorHistory() {
    this.errorHistory = [];
  }

  /**
   * Report error to backend or crash reporting service
   */
  private static async reportError(error: AppError) {
    try {
      // TODO: Implement error reporting to backend or crash reporting service
      console.log('Reporting error:', error);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  /**
   * Check network connectivity
   */
  static async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle network-specific errors
   */
  static async handleNetworkError(error: any, retryCallback?: () => Promise<any>) {
    const isConnected = await this.checkNetworkConnectivity();
    
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Retry',
            style: 'default',
            onPress: retryCallback,
          },
        ]
      );
      return;
    }

    // If connected but still getting network error, show generic error
    this.handleError(error, 'network_operation');
  }
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}

/**
 * Debounce function for preventing rapid API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
