import React, { useState, useEffect, useRef } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { AuthStackParamList } from '../../types';
import { RootState } from '../../store';
import { verifyOTP, resendOTP } from '../../store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/common/Button';
import Logo from '../../assets/images/tracSOpro-logo.png';

type GuardOTPScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'GuardOTP'>;
type GuardOTPScreenRouteProp = RouteProp<AuthStackParamList, 'GuardOTP'>;

const GuardOTPScreen: React.FC = () => {
  const navigation = useNavigation<GuardOTPScreenNavigationProp>();
  const route = useRoute<GuardOTPScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { tempUserId, isLoading: authLoading } = useSelector((state: RootState) => state.auth);
  
  const email = route.params?.email || '';
  const isPasswordReset = route.params?.isPasswordReset || false;

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-focus the input when screen loads
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Handle resend timer
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(numericValue);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP code');
      return;
    }

    if (!tempUserId) {
      Alert.alert('Error', 'User ID not found. Please try registering again.');
      return;
    }

    setIsLoading(true);
    try {
      if (isPasswordReset) {
        // For password reset, just navigate to reset screen
        navigation.navigate('ResetPassword', { email, otp });
      } else {
        // Use Redux action for OTP verification
        const result = await dispatch(verifyOTP({ userId: tempUserId, otp }));
        
        if (verifyOTP.fulfilled.match(result)) {
          // Success - navigate to profile setup
          Alert.alert(
            'Email Verified!', 
            'Your email has been verified successfully.',
            [{ text: 'Continue', onPress: () => navigation.navigate('GuardProfileSetup') }]
          );
        } else {
          // Handle specific error messages from backend
          const errorMessage = result.payload as string;
          if (errorMessage.includes('rate limit') || errorMessage.includes('Too many')) {
            Alert.alert('Too Many Attempts', errorMessage);
          } else {
            Alert.alert('Verification Failed', errorMessage || 'Invalid or expired OTP. Please try again.');
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !tempUserId) return;

    setCanResend(false);
    setResendTimer(60);
    
    try {
      const result = await dispatch(resendOTP(tempUserId));
      
      if (resendOTP.fulfilled.match(result)) {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your email address');
      } else {
        const errorMessage = result.payload as string;
        if (errorMessage.includes('rate limit') || errorMessage.includes('Too many')) {
          Alert.alert('Rate Limit Exceeded', errorMessage);
        } else if (errorMessage.includes('already verified')) {
          Alert.alert('Already Verified', 'Your email is already verified');
        } else {
          Alert.alert('Error', errorMessage || 'Failed to resend OTP. Please try again.');
        }
        setCanResend(true);
        setResendTimer(0);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      setCanResend(true);
      setResendTimer(0);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>VERIFY EMAIL</Text>
          <Text style={styles.subtitle}>
            We have sent an OTP code to your email.{'\n'}
            Please check your email
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          <View style={styles.otpInputWrapper}>
            <Icon name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              ref={inputRef}
              style={styles.otpInput}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
          </View>
        </View>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            Did not receive code? 
            <TouchableOpacity 
              onPress={handleResendOtp} 
              disabled={!canResend}
              style={styles.resendButton}
            >
              <Text style={[
                styles.resendLink, 
                !canResend && styles.resendLinkDisabled
              ]}>
                {canResend ? ' Resend Code' : ` Resend Code (${resendTimer}s)`}
              </Text>
            </TouchableOpacity>
          </Text>
        </View>

        {/* Verify Button */}
        <Button
          title="Verify"
          onPress={handleVerifyOtp}
          fullWidth
          size="large"
          loading={isLoading}
          disabled={otp.length !== 6}
          style={styles.verifyButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
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
    marginBottom: 60,
  },
  title: {
    fontFamily: 'Montserrat',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    letterSpacing: 1,
    color: '#000000',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#6B7280',
    paddingHorizontal: 20,
  },
  otpContainer: {
    marginBottom: 40,
  },
  otpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  otpInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
    letterSpacing: 2,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  resendText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
  },
  resendButton: {
    marginLeft: 4,
  },
  resendLink: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#1C6CA9',
  },
  resendLinkDisabled: {
    color: '#9CA3AF',
  },
  verifyButton: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});

export default GuardOTPScreen;
