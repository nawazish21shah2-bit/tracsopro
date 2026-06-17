// Forgot Password Screen Component
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { EmailIcon } from '../../components/ui/AppIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { forgotPassword, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../types';
import Button from '../../components/common/Button';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import { authStyles } from '../../styles/authStyles';
import { COLORS, SPACING } from '../../styles/globalStyles';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const result = await dispatch(forgotPassword(email));

      if (forgotPassword.fulfilled.match(result)) {
        navigation.navigate('GuardOTP', {
          email,
          isPasswordReset: true,
        });
      } else {
        const errorMessage = result.payload as string;
        Alert.alert('Error', errorMessage || 'Failed to send reset code. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred');
    }
  };

  const isValidEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  React.useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [dispatch, error]);

  if (emailSent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        <View style={styles.successContent}>
          <View style={styles.successHeader}>
            <EmailIcon size={28} color={COLORS.textInverse} />
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successSubtitle}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.backToLoginButton} onPress={navigateToLogin}>
            <Text style={styles.backToLoginButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundPrimary} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader
          title="FORGOT PASSWORD"
          subtitle="Enter your email address and we'll send you an OTP to reset your password."
        />

        <View style={authStyles.form}>
          <View style={authStyles.inputContainer}>
            <AuthInput
              icon="mail-outline"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <Button
            title={isLoading ? 'Sending OTP...' : 'Send OTP'}
            onPress={handleSendResetEmail}
            disabled={isLoading}
            loading={isLoading}
            fullWidth
            size="large"
            style={authStyles.submitButton}
          />
        </View>

        <View style={authStyles.footerLinkRow}>
          <Text style={authStyles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={navigateToLogin} disabled={isLoading} activeOpacity={isLoading ? 1 : 0.7}>
            <Text style={authStyles.linkText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.xxxl,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textInverse,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textInverse,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
  },
  backToLoginButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.textInverse,
    borderRadius: 8,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl,
    alignItems: 'center',
  },
  backToLoginButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
