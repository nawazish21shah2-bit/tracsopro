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

// Export navigation ref for use in notification service
export const navigationRef = React.createRef<any>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const internalNavigationRef = useRef<any>(null);
  const prevIsAuthenticated = useRef<boolean | null>(null);
  const [splashTimeout, setSplashTimeout] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Determine initial route based on auth state
  const initialRoute = isAuthenticated ? 'Main' : 'Auth';

  // Handle navigation reset when auth state changes
  useEffect(() => {
    // Skip initial render
    if (prevIsAuthenticated.current === null) {
      prevIsAuthenticated.current = isAuthenticated;
      setIsInitialized(true);
      if (__DEV__) {
        console.log('🔐 AppNavigator initialized', { isAuthenticated, initialRoute });
      }
      return;
    }

    // Only reset navigation if auth state actually changed
    if (prevIsAuthenticated.current !== isAuthenticated) {
      const targetRoute = isAuthenticated ? 'Main' : 'Auth';
      
      if (__DEV__) {
        console.log('🔄 Auth state changed, navigating to:', targetRoute, {
          prevAuth: prevIsAuthenticated.current,
          currentAuth: isAuthenticated,
        });
      }
      
      // Use a more robust navigation approach
      const navigate = (retryCount = 0) => {
        if (!navigationRef.current) {
          if (retryCount < 10) {
            setTimeout(() => navigate(retryCount + 1), 100);
          } else {
            console.error('❌ Navigation ref not available after retries');
          }
          return;
        }

        if (navigationRef.current.isReady()) {
          try {
            navigationRef.current.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: targetRoute }],
              })
            );
            if (__DEV__) {
              console.log('✅ Navigation reset successful to:', targetRoute);
            }
          } catch (error) {
            console.error('❌ Navigation reset failed:', error);
            // Retry once more on error
            if (retryCount < 2) {
              setTimeout(() => navigate(retryCount + 1), 200);
            }
          }
        } else {
          // Retry after a short delay if navigation isn't ready
          if (retryCount < 10) {
            setTimeout(() => navigate(retryCount + 1), 100);
          } else {
            console.warn('⚠️ Navigation not ready after retries, but proceeding');
            // Force navigation anyway
            try {
              navigationRef.current.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: targetRoute }],
                })
              );
            } catch (error) {
              console.error('❌ Forced navigation also failed:', error);
            }
          }
        }
      };
      
      // Start navigation attempt
      requestAnimationFrame(() => {
        navigate();
      });
    }

    prevIsAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, initialRoute]);

  // Only show splash screen during initial auth check (when not authenticated)
  // Once authenticated, show main app even if loading (e.g., during profile updates)
  // Also show navigation if splash timeout occurred
  if ((isLoading && !isAuthenticated && prevIsAuthenticated.current === null) && !splashTimeout) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer 
      ref={(ref) => {
        internalNavigationRef.current = ref;
        navigationRef.current = ref;
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
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
