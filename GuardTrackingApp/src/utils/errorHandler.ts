/**
 * Centralized Error Handling Utility
 * Provides consistent error message extraction and formatting across the app
 */

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  statusCode?: number;
  isNetworkError?: boolean;
}

export interface ParsedApiError {
  message: string;
  statusCode?: number;
  isNetworkError: boolean;
  errors?: string[];
}

export interface NetworkError {
  code?: string;
  message: string;
  status?: number;
  isNetworkError?: boolean;
  data?: {
    success?: boolean;
    message?: string;
    error?: string;
    errors?: string[];
  };
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

function readResponseBody(error: any): {
  statusCode?: number;
  data?: any;
} {
  if (error?.response?.status) {
    return { statusCode: error.response.status, data: error.response.data };
  }
  if (error?.status && error.status >= 400) {
    return { statusCode: error.status, data: error.data };
  }
  return {};
}

/**
 * Extract user-friendly error message from various error formats
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  const { data } = readResponseBody(error);

  if (data?.message) {
    return data.message;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors[0];
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Determine if error is a network/connection error (no HTTP response from server)
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  if (error.isNetworkError === true) return true;
  if (error.isNetworkError === false) return false;

  const { statusCode } = readResponseBody(error);
  if (statusCode && statusCode >= 400) {
    return false;
  }

  const networkErrorCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ECONNABORTED',
    'ENOTFOUND',
    'ERR_NETWORK',
  ];
  if (error.code && networkErrorCodes.includes(error.code)) {
    return true;
  }

  if (error.request && !error.response && !statusCode) {
    return true;
  }

  const errorMessage = (error.message || '').toLowerCase();
  if (
    errorMessage === 'network error' ||
    errorMessage.includes('network error') ||
    errorMessage.includes('timeout')
  ) {
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
    return `Cannot reach the server${baseURL ? ` at ${baseURL}` : ''}. Check your Wi‑Fi and that the backend is running.`;
  }

  return `Cannot connect to server${baseURL ? ` at ${baseURL}` : ''}. Check your connection and ensure the backend is running.`;
}

/**
 * Get user-friendly error message based on status code
 */
export function getStatusErrorMessage(statusCode: number, defaultMessage: string): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This resource already exists.';
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
 * Single parser for axios errors, wrapped api errors, and plain strings
 */
export function parseApiError(error: any, baseURL?: string): ParsedApiError {
  if (typeof error === 'string') {
    return { message: error, isNetworkError: false };
  }

  const { statusCode, data } = readResponseBody(error);

  if (statusCode && statusCode >= 400) {
    const message =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) && data.errors[0]) ||
      error?.message ||
      getStatusErrorMessage(statusCode, 'Request failed');

    return {
      message,
      statusCode,
      isNetworkError: false,
      errors: Array.isArray(data?.errors) ? data.errors : undefined,
    };
  }

  if (isNetworkError(error)) {
    return {
      message: getNetworkErrorMessage(error, baseURL),
      isNetworkError: true,
    };
  }

  return {
    message: error?.message || 'An unexpected error occurred. Please try again.',
    isNetworkError: false,
  };
}

/**
 * Format error for display to user
 */
export function formatErrorForUser(error: any, baseURL?: string): ErrorResponse {
  const parsed = parseApiError(error, baseURL);

  return {
    success: false,
    message: parsed.message,
    errors: parsed.errors,
    statusCode: parsed.statusCode,
    isNetworkError: parsed.isNetworkError,
  };
}

/**
 * Check if error message indicates a specific error type
 */
export function isErrorType(error: any, keywords: string[]): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return keywords.some((keyword) => message.includes(keyword.toLowerCase()));
}

/**
 * Get actionable error message with suggestions
 */
export function getActionableErrorMessage(error: any): {
  title: string;
  message: string;
  actions?: string[];
} {
  const parsed = parseApiError(error);
  const errorMessage = parsed.message;
  const statusCode = parsed.statusCode;

  if (isErrorType(error, ['already registered', 'email exists', 'duplicate email', 'login instead'])) {
    return {
      title: 'Email Already Registered',
      message: errorMessage,
      actions: ['Login', 'Forgot Password'],
    };
  }

  if (isErrorType(error, ['invalid invitation', 'invitation code', 'invitation is for'])) {
    return {
      title: 'Invalid Invitation Code',
      message: errorMessage,
    };
  }

  if (statusCode === 429 || isErrorType(error, ['rate limit', 'too many', 'throttle'])) {
    return {
      title: 'Rate Limit Exceeded',
      message: 'Too many attempts. Please wait a few minutes before trying again.',
    };
  }

  if (statusCode === 400 && parsed.errors?.length) {
    return {
      title: 'Validation Error',
      message: errorMessage,
    };
  }

  if (parsed.isNetworkError) {
    return {
      title: 'Connection Error',
      message: errorMessage,
      actions: ['Retry', 'Check Settings'],
    };
  }

  return {
    title: 'Error',
    message: errorMessage,
  };
}

export interface AppError {
  message: string;
  action: string;
  timestamp: string;
  statusCode?: number;
  isNetworkError?: boolean;
}

const errorHistory: AppError[] = [];

function resolveUserMessage(error: any): string {
  if (error?.code === 'NETWORK_ERROR') {
    return 'Network connection error. Please check your internet connection.';
  }

  const parsed = parseApiError(error);
  return parsed.message;
}

export class ErrorHandler {
  static handleError(error: any, action: string, _showAlert = true): AppError {
    const appError: AppError = {
      message: resolveUserMessage(error),
      action,
      timestamp: new Date().toISOString(),
      statusCode: parseApiError(error).statusCode,
      isNetworkError: parseApiError(error).isNetworkError,
    };

    errorHistory.unshift(appError);
    if (errorHistory.length > 50) {
      errorHistory.pop();
    }

    return appError;
  }

  static clearErrorHistory(): void {
    errorHistory.length = 0;
  }

  static getErrorHistory(): AppError[] {
    return [...errorHistory];
  }

  static async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      const state = await NetInfo.fetch();
      return state.isConnected === true;
    } catch {
      return true;
    }
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
