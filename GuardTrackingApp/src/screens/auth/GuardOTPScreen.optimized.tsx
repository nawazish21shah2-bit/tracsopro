import React, { useState, useEffect } from 'react';
import { View, StatusBar, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Button from '../../components/common/Button';
import AuthHeader from '../../components/auth/AuthHeader';
import OTPInput from '../../components/auth/OTPInput';
import { AuthStackParamList } from '../../types';
import { authStyles } from '../../styles/authStyles';

type GuardOTPScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'GuardOTP'>;
type GuardOTPScreenRouteProp = RouteProp<AuthStackParamList, 'GuardOTP'>;

const GuardOTPScreen: React.FC = () => {
  const navigation = useNavigation<GuardOTPScreenNavigationProp>();
  const route = useRoute<GuardOTPScreenRouteProp>();
  const email = route.params?.email || '';
  const isPasswordReset = route.params?.isPasswordReset || false;

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      
      if (isPasswordReset) {
        navigation.navigate('ResetPassword', { email, otp });
      } else {
        navigation.navigate('GuardProfileSetup');
      }
    } catch (error) {
      Alert.alert('Verification Failed', 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
    
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      Alert.alert('OTP Sent', 'A new OTP has been sent to your email');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      setCanResend(true);
      setResendTimer(0);
    }
  };

  return (
    <View style={authStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        contentContainerStyle={authStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader 
          title="VERIFY EMAIL"
          subtitle={`We have sent an OTP code to your email.\nPlease check your email`}
        />

        <OTPInput
          value={otp}
          onChangeText={setOtp}
          onResend={handleResendOtp}
          canResend={canResend}
          resendTimer={resendTimer}
        />

        <Button
          title="Verify"
          onPress={handleVerifyOtp}
          fullWidth
          size="large"
          loading={isLoading}
          disabled={otp.length !== 6}
          style={authStyles.submitButton}
        />
      </ScrollView>
    </View>
  );
};

export default GuardOTPScreen;
