// Authentication Navigator
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
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
// Removed redundant screens:
// - AccountTypeScreen (replaced by ClientAccountTypeScreen)
// - RegisterScreen (replaced by GuardSignupScreen and ClientSignupScreen)
// - EmailVerificationScreen (replaced by GuardOTPScreen and ClientOTPScreen)
// - ProfileSetupScreen (replaced by GuardProfileSetupScreen and ClientProfileSetupScreen)
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import { AuthStackParamList } from '../types';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
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
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;