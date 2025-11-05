// Enhanced Test Utilities for Guard Tracking App
import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '../utils/theme';
import { lightTheme } from '../utils/theme';

// Mock store for testing
export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false, isLoading: false, error: null }) => state,
      guards: (state = { guards: [], isLoading: false, error: null }) => state,
      incidents: (state = { incidents: [], isLoading: false, error: null }) => state,
      notifications: (state = { notifications: [], isLoading: false, error: null }) => state,
      locations: (state = { locations: [], isLoading: false, error: null }) => state,
      messages: (state = { messages: [], isLoading: false, error: null }) => state,
    },
    preloadedState: initialState,
  });
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  store?: any;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialState = {},
    store = createMockStore(initialState),
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <ThemeProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
};

// Mock route
export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen',
  params: {},
};

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'guard',
  isActive: true,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

export const createMockGuard = (overrides = {}) => ({
  id: '1',
  userId: '1',
  employeeId: 'EMP001',
  department: 'Security',
  hireDate: new Date('2023-01-01'),
  emergencyContact: {
    name: 'Jane Doe',
    relationship: 'Spouse',
    phone: '+1234567891',
    email: 'jane@example.com',
  },
  qualifications: [],
  performance: {
    totalShifts: 100,
    completedShifts: 95,
    incidentsReported: 5,
    averageRating: 4.5,
  },
  status: 'active',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
});

export const createMockIncident = (overrides = {}) => ({
  id: '1',
  guardId: '1',
  location: {
    id: '1',
    name: 'Main Building',
    address: '123 Main St',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    type: 'building',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  type: 'security_breach',
  severity: 'high',
  description: 'Unauthorized access detected',
  evidence: [],
  status: 'reported',
  reportedAt: new Date('2023-01-01'),
  ...overrides,
});

// Async testing utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () => new Promise(setImmediate);

// Mock API responses
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
  errors: success ? undefined : ['Test error'],
});

// Test assertions helpers
export const expectToBeVisible = (element: any) => {
  expect(element).toBeTruthy();
};

export const expectToHaveText = (element: any, text: string) => {
  expect(element).toHaveTextContent(text);
};

export const expectToHaveStyle = (element: any, style: any) => {
  expect(element).toHaveStyle(style);
};

// Mock functions
export const mockDispatch = jest.fn();
export const mockUseDispatch = () => mockDispatch;

export const mockUseSelector = (selector: any) => {
  const mockState = {
    auth: { user: null, isAuthenticated: false, isLoading: false, error: null },
    guards: { guards: [], isLoading: false, error: null },
    incidents: { incidents: [], isLoading: false, error: null },
    notifications: { notifications: [], isLoading: false, error: null },
    locations: { locations: [], isLoading: false, error: null },
    messages: { messages: [], isLoading: false, error: null },
  };
  return selector(mockState);
};

// Cleanup function
export const cleanup = () => {
  jest.clearAllMocks();
};

export default {
  renderWithProviders,
  createMockStore,
  mockNavigation,
  mockRoute,
  createMockUser,
  createMockGuard,
  createMockIncident,
  waitFor,
  flushPromises,
  mockApiResponse,
  expectToBeVisible,
  expectToHaveText,
  expectToHaveStyle,
  mockDispatch,
  mockUseDispatch,
  mockUseSelector,
  cleanup,
};