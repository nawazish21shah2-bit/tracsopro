// Main App Component for Guard Tracking App
import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import LoadingSpinner from './src/components/common/LoadingSpinner';
import { ThemeProvider } from './src/utils/theme';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingSpinner text="Loading app..." overlay />} persistor={persistor}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <StatusBar 
                barStyle="dark-content" 
                backgroundColor="transparent" 
                translucent={true}
                hidden={false}
              />
              <AppNavigator />
            </GestureHandlerRootView>
          </PersistGate>
        </Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;