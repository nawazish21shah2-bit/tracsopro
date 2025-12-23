/**
 * Centralized Error Handling Utility
 * Provides consistent error message extraction and formatting across the app
 */

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  statusCode?: number;
}

export interface NetworkError {
  code?: string;
  message: string;
  response?: {
    status: number;
    data?: {
      success?: boolean;
      message?: string;
      error?: string;
      errors?: string[];
    };
  };
}

/**
 * Extract user-friendly error message from various error formats
 */
export function extractErrorMessage(error: any): string {
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle error objects with response (Axios errors)
  if (error?.response?.data) {
    const errorData = error.response.data;
    
    // Backend returns { success: false, message: "..." }
    if (errorData.message) {
      return errorData.message;
    }
    
    // Alternative format: { success: false, error: "..." }
    if (errorData.error) {
      return errorData.error;
    }
    
    // Validation errors: { success: false, errors: [...] }
    if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      return errorData.errors[0];
    }
  }

  // Handle error.message
  if (error?.message) {
    return error.message;
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Determine if error is a network/connection error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // No response means network error
  if (!error.response) {
    return true;
  }
  
  // Check for specific network error codes
  const networkErrorCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED', 'ENOTFOUND'];
  if (error.code && networkErrorCodes.includes(error.code)) {
    return true;
  }
  
  // Check for network-related messages
  const errorMessage = error.message?.toLowerCase() || '';
  if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return true;
  }
  
  return false;
}

/**
 * Get user-friendly network error message
 */
export function getNetworkErrorMessage(error: any, baseURL?: string): string {
  const errorCode = error?.code;
  const errorMessage = error?.message || '';

  if (errorCode === 'ECONNREFUSED') {
    return `Cannot connect to server${baseURL ? ` at ${baseURL}` : ''}. Please ensure the backend server is running.`;
  }
  
  if (errorCode === 'ETIMEDOUT' || errorCode === 'ECONNABORTED') {
    return 'Request timed out. The server may be slow or unresponsive. Please try again.';
  }
  
  if (errorMessage.includes('Network Error') || errorMessage.includes('network')) {
    return 'Network error. Please check your internet connection and ensure the backend server is running.';
  }
  
  return 'Unable to connect to server. Please check your internet connection and ensure the backend server is running.';
}

/**
 * Get user-friendly error message based on status code
 */
export function getStatusErrorMessage(statusCode: number, defaultMessage: string): string {
  switch (statusCode) {
    case 400:
      return defaultMessage || 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return defaultMessage || 'This resource already exists.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later or contact support if the problem persists.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return defaultMessage || 'An error occurred. Please try again.';
  }
}

/**
 * Format error for display to user
 */
export function formatErrorForUser(error: any, baseURL?: string): ErrorResponse {
  // Check if it's a network error
  if (isNetworkError(error)) {
    return {
      success: false,
      message: getNetworkErrorMessage(error, baseURL),
      statusCode: undefined,
    };
  }

  // Extract message from response
  const message = extractErrorMessage(error);
  const statusCode = error?.response?.status;

  // Enhance message with status code context if needed
  const userMessage = statusCode 
    ? getStatusErrorMessage(statusCode, message)
    : message;

  // Extract validation errors if present
  const errors = error?.response?.data?.errors || [];

  return {
    success: false,
    message: userMessage,
    errors: errors.length > 0 ? errors : undefined,
    statusCode,
  };
}

/**
 * Check if error message indicates a specific error type
 */
export function isErrorType(error: any, keywords: string[]): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return keywords.some(keyword => message.includes(keyword.toLowerCase()));
}

/**
 * Get actionable error message with suggestions
 */
export function getActionableErrorMessage(error: any): { title: string; message: string; actions?: string[] } {
  const errorMessage = extractErrorMessage(error).toLowerCase();
  const statusCode = error?.response?.status;

  // Email already registered
  if (isErrorType(error, ['already registered', 'email exists', 'duplicate email'])) {
    return {
      title: 'Email Already Registered',
      message: extractErrorMessage(error),
      actions: ['Login', 'Forgot Password'],
    };
  }

  // Rate limiting
  if (statusCode === 429 || isErrorType(error, ['rate limit', 'too many', 'throttle'])) {
    return {
      title: 'Rate Limit Exceeded',
      message: 'Too many attempts. Please wait a few minutes before trying again.',
    };
  }

  // Validation errors
  if (statusCode === 400 && error?.response?.data?.errors) {
    return {
      title: 'Validation Error',
      message: extractErrorMessage(error),
    };
  }

  // Network errors
  if (isNetworkError(error)) {
    return {
      title: 'Connection Error',
      message: getNetworkErrorMessage(error),
      actions: ['Retry', 'Check Settings'],
    };
  }

  // Default
  return {
    title: 'Error',
    message: extractErrorMessage(error),
  };
}
