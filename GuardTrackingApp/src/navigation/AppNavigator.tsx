// Main App Navigator for Guard Tracking App
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// Import screens
import SplashScreen from '../screens/SplashScreen';

// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const navigationRef = useRef<any>(null);
  const prevIsAuthenticated = useRef<boolean | null>(null);
  const [splashTimeout, setSplashTimeout] = useState(false);

  // Set a timeout for splash screen to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSplashTimeout(true);
      if (__DEV__) {
        console.warn('Splash screen timeout - proceeding to navigation');
      }
    }, 15000); // 15 second timeout for splash screen

    return () => clearTimeout(timeout);
  }, []);

  // Handle navigation reset when auth state changes
  useEffect(() => {
    // Skip initial render
    if (prevIsAuthenticated.current === null) {
      prevIsAuthenticated.current = isAuthenticated;
      return;
    }

    // Only reset navigation if auth state actually changed
    if (prevIsAuthenticated.current !== isAuthenticated && navigationRef.current) {
      const targetRoute = isAuthenticated ? 'Main' : 'Auth';
      
      // Use setTimeout to ensure state updates are complete before navigation reset
      setTimeout(() => {
        if (navigationRef.current?.isReady()) {
          navigationRef.current.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: targetRoute }],
            })
          );
        }
      }, 0);
    }

    prevIsAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  // Only show splash screen during initial auth check (when not authenticated)
  // Once authenticated, show main app even if loading (e.g., during profile updates)
  // Also show navigation if splash timeout occurred
  if ((isLoading && !isAuthenticated && prevIsAuthenticated.current === null) && !splashTimeout) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
