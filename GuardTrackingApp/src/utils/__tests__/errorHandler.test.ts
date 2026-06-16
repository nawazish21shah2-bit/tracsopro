import { describe, it } from '@jest/globals';
import {
  isNetworkError,
  parseApiError,
  extractErrorMessage,
} from '../errorHandler';

describe('errorHandler', () => {
  it('does not treat HTTP 409 as network error when response was stripped', () => {
    const wrapped = new Error('Email already registered. Please login instead.');
    (wrapped as any).status = 409;
    (wrapped as any).data = { success: false, message: 'Email already registered. Please login instead.' };
    (wrapped as any).isNetworkError = false;

    expect(isNetworkError(wrapped)).toBe(false);
    expect(parseApiError(wrapped).message).toBe('Email already registered. Please login instead.');
  });

  it('treats ECONNREFUSED as network error', () => {
    const err = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED', request: {} };
    expect(isNetworkError(err)).toBe(true);
    expect(parseApiError(err).isNetworkError).toBe(true);
  });

  it('extracts backend message from axios-shaped error', () => {
    const err = {
      response: {
        status: 400,
        data: { success: false, message: 'Invalid invitation code' },
      },
    };
    expect(extractErrorMessage(err)).toBe('Invalid invitation code');
    expect(parseApiError(err).message).toBe('Invalid invitation code');
  });

  it('handles plain string errors', () => {
    expect(parseApiError('Invalid invitation code').message).toBe('Invalid invitation code');
  });
});
