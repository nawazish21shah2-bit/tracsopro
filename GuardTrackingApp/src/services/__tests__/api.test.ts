// API Service Tests - Testing authentication and axios wiring
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../utils/security', () => ({
  securityManager: {
    getTokens: jest.fn().mockResolvedValue(null),
    areTokensValid: jest.fn().mockResolvedValue(false),
    clearTokens: jest.fn().mockResolvedValue(true),
  },
}));

import apiService from '../api';

describe('ApiService', () => {
  it('exposes login method', () => {
    expect(typeof apiService.login).toBe('function');
  });

  it('exposes authenticated request helpers', () => {
    expect(typeof apiService.get).toBe('function');
    expect(typeof apiService.post).toBe('function');
  });
});
