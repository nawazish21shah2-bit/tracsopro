// Main App Component for Guard Tracking App
import React, { useState, useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import LoadingSpinner from './src/components/common/LoadingSpinner';
import { ThemeProvider } from './src/utils/theme';

// Custom PersistGate with timeout to prevent infinite loading
const PersistGateWithTimeout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    // Set a timeout of 5 seconds for rehydration
    const timeout = setTimeout(() => {
      console.warn('PersistGate rehydration timeout - proceeding anyway');
      setHasTimedOut(true);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // If timeout occurred, render children directly
  if (hasTimedOut) {
    return <>{children}</>;
  }

  return (
    <PersistGate loading={<LoadingSpinner text="Loading app..." overlay />} persistor={persistor}>
      {children}
    </PersistGate>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <Provider store={store}>
            <PersistGateWithTimeout>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar 
                  barStyle="dark-content" 
                  backgroundColor="transparent" 
                  translucent={true}
                  hidden={false}
                />
                <AppNavigator />
              </GestureHandlerRootView>
            </PersistGateWithTimeout>
          </Provider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;