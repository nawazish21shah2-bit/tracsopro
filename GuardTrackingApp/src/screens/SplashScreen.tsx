// Splash Screen Component
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { getCurrentUser } from '../store/slices/authSlice';
import { securityManager } from '../utils/security';
import { useTheme } from '../utils/theme';
import Logo from '../assets/images/tracSOpro-logo.png';

const SplashScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();

  useEffect(() => {
    // Check if user is already authenticated (only if token exists)
    const checkAuthStatus = async () => {
      try {
        const hasValidTokens = await securityManager.areTokensValid();
        if (hasValidTokens) {
          await dispatch(getCurrentUser());
        } else if (__DEV__) {
          console.log('Skipping /auth/me: no valid tokens in storage');
        }
      } catch (error) {
        console.log('No existing authentication');
      }
    };

    checkAuthStatus();
  }, [dispatch]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
      
      {/* App Logo */}
      <View style={styles.logoContainer}>
        <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  appName: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoImage: {
    width: 200,
    height: 150 ,
  },
});

export default SplashScreen;
