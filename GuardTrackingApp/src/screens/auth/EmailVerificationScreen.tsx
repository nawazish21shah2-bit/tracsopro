// Email Verification Screen Component
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import Button from '../../components/common/Button';
import { AppIcon } from '../../components/ui/AppIcons';
import Logo from '../../assets/images/tracSOpro-logo.png';
import { authStyles, AUTH_LOGO_TOP, AUTH_LOGO_TO_HEADING, AUTH_HEADING_TO_FORM } from '../../styles/authStyles';
import { COLORS, SPACING } from '../../styles/globalStyles';

// Note: This screen is deprecated - replaced by GuardOTPScreen, ClientOTPScreen, AdminOTPScreen
// Keeping for backward compatibility but not registered in navigation
type EmailVerificationScreenNavigationProp = StackNavigationProp<any>;
type EmailVerificationScreenRouteProp = RouteProp<any>;

const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<EmailVerificationScreenNavigationProp>();
  const route = useRoute<EmailVerificationScreenRouteProp>();
  const email = (route.params as any)?.email || '';
  const isPasswordReset = (route.params as any)?.isPasswordReset || false;

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(numericValue);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const apiService = (await import('../../services/api')).default;
      
      if (isPasswordReset) {
        // For password reset, verify OTP first, then navigate to reset password
        // The OTP verification is done in the reset password API call
        navigation.navigate('ResetPassword', { email, otp });
      } else {
        // For email verification, we need userId from route params or temp state
        // This screen should receive userId from registration flow
        const tempUserId = route.params?.userId;
        if (!tempUserId) {
          Alert.alert('Error', 'User ID not found. Please register again.');
          navigation.navigate('RoleSelection' as never);
          return;
        }

        // Verify OTP for email verification
        const result = await apiService.verifyOTP(tempUserId, otp);
        
        if (result.success) {
          // Navigate to profile setup for registration
          // Navigate to appropriate profile setup based on role
          // This screen is deprecated - should use role-specific OTP screens
          navigation.navigate('GuardProfileSetup' as never);
        } else {
          Alert.alert('Error', result.message || 'Invalid OTP. Please try again.');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setCanResend(false);
    setIsLoading(true);
    
    try {
      const apiService = (await import('../../services/api')).default;
      
      if (isPasswordReset) {
        // For password reset, use forgot password again
        const result = await apiService.forgotPassword(email);
        if (result.success) {
          Alert.alert('Success', 'A new password reset code has been sent to your email');
          // Start 60 second timer
          setTimeout(() => setCanResend(true), 60000);
        } else {
          Alert.alert('Error', result.message || 'Failed to resend code. Please try again.');
          setCanResend(true);
        }
      } else {
        // For email verification, resend OTP
        const tempUserId = route.params?.userId;
        if (!tempUserId) {
          Alert.alert('Error', 'User ID not found. Please register again.');
          setCanResend(true);
          return;
        }

        const result = await apiService.resendOTP(tempUserId);
        if (result.success) {
          Alert.alert('Success', 'A new verification code has been sent to your email');
          // Start 60 second timer
          setTimeout(() => setCanResend(true), 60000);
        } else {
          Alert.alert('Error', result.message || 'Failed to resend code. Please try again.');
          setCanResend(true);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code. Please try again.');
      setCanResend(true);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Logo */}
      <View style={authStyles.logoContainer}>
        <Image source={Logo} style={authStyles.logoImage} resizeMode="contain" />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[authStyles.title, styles.titleWithSubtitle]}>
          {isPasswordReset ? 'RESET PASSWORD' : 'VERIFY EMAIL'}
        </Text>
        <Text style={authStyles.subtitle}>
          We have sent an OTP code to your email.{'\n'}Please check your email
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}>
            <AppIcon type="material" name="vpn-key" size={20} color="#1C6CA9" />
          </View>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Enter OTP"
            placeholderTextColor="#9CA3AF"
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
            autoFocus
          />
        </View>

        {/* Resend Code Link */}
        <View style={styles.resendContainer}>
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Did not receive code? </Text>
            <TouchableOpacity 
              onPress={handleResendCode} 
              disabled={!canResend || isLoading}
              activeOpacity={(!canResend || isLoading) ? 1 : 0.7}
            >
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verify Button */}
        <Button
          title={isLoading ? 'Verifying...' : 'Verify'}
          onPress={handleVerifyOtp}
          disabled={isLoading || otp.length < 6}
          loading={isLoading}
          fullWidth
          size="large"
          style={{ marginTop: 'auto', marginBottom: 40 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  logoImage: {
    width: 160,
    height: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: AUTH_HEADING_TO_FORM,
  },
  titleWithSubtitle: {
    marginBottom: SPACING.sm, // Reduced gap between title and subtitle (8px)
  },
  form: {
    flex: 1,
    marginTop: 20,
  },
  inputWrapper: {
    height: 56,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  iconContainer: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.408,
    color: '#000000',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  resendLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 17,
    color: '#6B7280',
  },
  resendLink: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 17,
    color: '#1C6CA9',
  },
});

export default EmailVerificationScreen;
