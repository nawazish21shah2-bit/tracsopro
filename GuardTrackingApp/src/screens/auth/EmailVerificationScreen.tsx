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

type EmailVerificationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'EmailVerification'>;
type EmailVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'EmailVerification'>;

const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<EmailVerificationScreenNavigationProp>();
  const route = useRoute<EmailVerificationScreenRouteProp>();
  const email = route.params?.email || '';
  const isPasswordReset = route.params?.isPasswordReset || false;

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
    // For now, skip OTP verification since backend doesn't have it yet
    // TODO: Implement proper OTP verification with backend
    setIsLoading(true);
    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (isPasswordReset) {
        // Navigate to reset password screen
        navigation.navigate('ResetPassword', { email, otp: '12345' });
      } else {
        // Navigate to profile setup for registration
        navigation.navigate('ProfileSetup');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      // Simulate resend API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Verification code sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {isPasswordReset ? 'RESET PASSWORD' : 'VERIFY EMAIL'}
        </Text>
        <Text style={styles.subtitle}>
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
          <Text style={styles.resendLabel}>Did not receive code? </Text>
          <TouchableOpacity onPress={handleResendCode} disabled={!canResend || isLoading}>
            <Text style={styles.resendLink}>Resend Code</Text>
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <Button
          title={isLoading ? 'Verifying...' : 'Verify'}
          onPress={handleVerifyOtp}
          disabled={isLoading || otp.length < 4}
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
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 12,
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    color: '#6B7280',
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
