import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { resendOTP, verifyOTP } from '../../store/slices/authSlice';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import ScreenBackHeader from '../../components/common/ScreenBackHeader';
import Button from '../../components/common/Button';
import AuthOtpInput from '../../components/auth/AuthOtpInput';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

const RESEND_COOLDOWN_SECONDS = 60;
const initialCodeSentUserIds = new Set<string>();

const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isEmailVerified } = useSelector((state: RootState) => state.auth);

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEmailVerified) {
      navigation.goBack();
    }
  }, [isEmailVerified, navigation]);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
  }, [resendTimer]);

  const sendVerificationCode = async (showSuccessAlert = false) => {
    if (!user?.id) {
      Alert.alert('Error', 'Unable to send verification code. Please log in again.');
      return;
    }

    setIsSendingCode(true);
    setCanResend(false);
    setResendTimer(RESEND_COOLDOWN_SECONDS);

    try {
      const result = await dispatch(resendOTP(user.id));
      if (resendOTP.fulfilled.match(result)) {
        if (showSuccessAlert) {
          Alert.alert('Code Sent', 'A verification code has been sent to your email.');
        }
      } else {
        const errorMessage = result.payload as string;
        if (errorMessage.includes('already verified')) {
          Alert.alert('Already Verified', 'Your email is already verified.');
          navigation.goBack();
        } else {
          Alert.alert('Error', errorMessage || 'Failed to send verification code.');
          setCanResend(true);
          setResendTimer(0);
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
      setCanResend(true);
      setResendTimer(0);
    } finally {
      setIsSendingCode(false);
    }
  };

  useEffect(() => {
    if (!user?.id || isEmailVerified || initialCodeSentUserIds.has(user.id)) {
      return;
    }
    initialCodeSentUserIds.add(user.id);
    sendVerificationCode(false);
  }, [user?.id, isEmailVerified]);

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/[^0-9]/g, '').slice(0, 6));
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'Unable to verify email. Please log in again.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await dispatch(verifyOTP({ userId: user.id, otp }));
      if (verifyOTP.fulfilled.match(result)) {
        Alert.alert('Email Verified', 'Your email has been verified successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const errorMessage = result.payload as string;
        Alert.alert('Verification Failed', errorMessage || 'Invalid or expired code. Please try again.');
      }
    } catch {
      Alert.alert('Verification Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend || isSendingCode) {
      return;
    }
    sendVerificationCode(true);
  };

  return (
    <SafeAreaWrapper backgroundColor={COLORS.backgroundPrimary}>
      <ScreenBackHeader title="Verify Email" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.email}>{user?.email || 'your email address'}</Text>
        </Text>

        <View style={styles.otpContainer}>
          <AuthOtpInput
            ref={inputRef}
            value={otp}
            onChangeText={handleOtpChange}
            autoFocus
          />
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Did not receive the code?</Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend || isSendingCode}>
            <Text style={[styles.resendLink, (!canResend || isSendingCode) && styles.resendLinkDisabled]}>
              {canResend ? 'Resend Code' : `Resend Code (${resendTimer}s)`}
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Verify Email"
          onPress={handleVerify}
          fullWidth
          size="large"
          loading={isLoading}
          disabled={otp.length !== 6}
        />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
    fontFamily: TYPOGRAPHY.fontPrimary,
  },
  email: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  otpContainer: {
    marginBottom: SPACING.lg,
  },
  resendRow: {
    marginBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
  },
  resendLinkDisabled: {
    color: COLORS.textTertiary,
  },
});

export default EmailVerificationScreen;
