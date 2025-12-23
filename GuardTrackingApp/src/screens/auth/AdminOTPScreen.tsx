import React, { useState, useRef, useEffect } from 'react';
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
import Button from '../../components/common/Button';
import Icon from 'react-native-vector-icons/Ionicons';
import Logo from '../../assets/images/tracSOpro-logo.png';
import { authStyles, AUTH_HEADING_TO_FORM } from '../../styles/authStyles';
import { COLORS, SPACING } from '../../styles/globalStyles';

type AdminOTPScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'AdminOTP'>;
type AdminOTPScreenRouteProp = RouteProp<AuthStackParamList, 'AdminOTP'>;

const AdminOTPScreen: React.FC = () => {
  const navigation = useNavigation<AdminOTPScreenNavigationProp>();
  const route = useRoute<AdminOTPScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { tempUserId, isLoading: authLoading } = useSelector((state: RootState) => state.auth);
  
  const email = route.params?.email || '';
  const accountType = route.params?.accountType || 'company';
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

    if (!tempUserId && !isPasswordReset) {
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
        const result = await dispatch(verifyOTP({ userId: tempUserId!, otp }));
        
        if (verifyOTP.fulfilled.match(result)) {
          // Success - navigate to profile setup
          Alert.alert(
            'Email Verified!', 
            'Your email has been verified successfully.',
            [{ text: 'Continue', onPress: () => navigation.navigate('AdminProfileSetup', { accountType }) }]
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
    if (!canResend || (!tempUserId && !isPasswordReset)) return;

    setCanResend(false);
    setResendTimer(60);
    
    try {
      if (isPasswordReset) {
        // For password reset, we need to implement forgot password resend
        // For now, show message to use forgot password again
        Alert.alert('Resend Code', 'Please use the "Forgot Password" option from the login screen to receive a new code.');
        setCanResend(true);
        setResendTimer(0);
        return;
      }

      const result = await dispatch(resendOTP(tempUserId!));
      
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
        <View style={authStyles.logoContainer}>
          <Image source={Logo} style={authStyles.logoImage} resizeMode="contain" />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[authStyles.title, styles.titleWithSubtitle]}>VERIFY EMAIL</Text>
          <Text style={authStyles.subtitle}>
            We have sent an OTP code to your email.{'\n'}
            Please check your email
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          <View style={styles.otpInputWrapper}>
            <Icon name="search-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
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
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Did not receive code? </Text>
            <TouchableOpacity 
              onPress={handleResendOtp} 
              disabled={!canResend}
              activeOpacity={!canResend ? 1 : 0.7}
            >
              <Text style={[
                styles.resendLink, 
                !canResend && styles.resendLinkDisabled
              ]}>
                {canResend ? 'Resend Code' : `Resend Code (${resendTimer}s)`}
              </Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: AUTH_HEADING_TO_FORM,
  },
  titleWithSubtitle: {
    marginBottom: SPACING.sm, // Reduced gap between title and subtitle (8px)
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
    paddingHorizontal: 16,
    marginBottom: 60,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
  },
  resendText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#6B7280',
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

export default AdminOTPScreen;

