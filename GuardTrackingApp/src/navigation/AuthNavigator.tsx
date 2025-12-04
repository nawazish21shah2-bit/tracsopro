// Authentication Navigator
import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import GuardSignupScreen from '../screens/auth/GuardSignupScreen';
import GuardOTPScreen from '../screens/auth/GuardOTPScreen';
import GuardProfileSetupScreen from '../screens/auth/GuardProfileSetupScreen';
import ClientAccountTypeScreen from '../screens/auth/ClientAccountTypeScreen';
import ClientSignupScreen from '../screens/auth/ClientSignupScreen';
import ClientOTPScreen from '../screens/auth/ClientOTPScreen';
import ClientProfileSetupScreen from '../screens/auth/ClientProfileSetupScreen';
import AdminAccountTypeScreen from '../screens/auth/AdminAccountTypeScreen';
import AdminSignupScreen from '../screens/auth/AdminSignupScreen';
import AdminOTPScreen from '../screens/auth/AdminOTPScreen';
import AdminProfileSetupScreen from '../screens/auth/AdminProfileSetupScreen';
// Removed redundant screens:
// - AccountTypeScreen (replaced by ClientAccountTypeScreen)
// - RegisterScreen (replaced by GuardSignupScreen and ClientSignupScreen)
// - EmailVerificationScreen (replaced by GuardOTPScreen and ClientOTPScreen)
// - ProfileSetupScreen (replaced by GuardProfileSetupScreen and ClientProfileSetupScreen)
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import { AuthStackParamList } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Stack = createStackNavigator<AuthStackParamList>();

const ONBOARDING_KEY = 'hasSeenOnboarding';

const AuthNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      setInitialRoute(hasSeenOnboarding === 'true' ? 'Login' : 'Onboarding');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to onboarding if there's an error
      setInitialRoute('Onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || initialRoute === null) {
    return <LoadingSpinner text="Loading..." overlay={false} />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute as 'Onboarding' | 'Login'}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="GuardSignup" component={GuardSignupScreen} />
      <Stack.Screen name="GuardOTP" component={GuardOTPScreen} />
      <Stack.Screen name="GuardProfileSetup" component={GuardProfileSetupScreen} />
      <Stack.Screen name="ClientAccountType" component={ClientAccountTypeScreen} />
      <Stack.Screen name="ClientSignup" component={ClientSignupScreen} />
      <Stack.Screen name="ClientOTP" component={ClientOTPScreen} />
      <Stack.Screen name="ClientProfileSetup" component={ClientProfileSetupScreen} />
      <Stack.Screen name="AdminAccountType" component={AdminAccountTypeScreen} />
      <Stack.Screen name="AdminSignup" component={AdminSignupScreen} />
      <Stack.Screen name="AdminOTP" component={AdminOTPScreen} />
      <Stack.Screen name="AdminProfileSetup" component={AdminProfileSetupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;