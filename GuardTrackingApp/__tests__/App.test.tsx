/**
 * @format
 */
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store';

jest.mock('../src/navigation/AppNavigator', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return () => (
    <View>
      <Text>App Navigator</Text>
    </View>
  );
});

jest.mock('redux-persist', () => {
  const real = jest.requireActual('redux-persist');
  return {
    ...real,
    persistReducer: (_config: unknown, reducers: unknown) => reducers,
    persistStore: () => ({
      purge: jest.fn(),
      flush: jest.fn(),
      pause: jest.fn(),
      persist: jest.fn(),
    }),
  };
});

describe('App', () => {
  it('renders without crashing when store is provided', () => {
    const App = require('../App').default;
    const { render } = require('@testing-library/react-native');
    const tree = render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    expect(tree).toBeTruthy();
  });
});
