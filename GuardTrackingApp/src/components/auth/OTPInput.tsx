import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { OTPIcon } from '../ui/AppIcons';

interface OTPInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onResend: () => void;
  canResend: boolean;
  resendTimer: number;
  autoFocus?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChangeText,
  onResend,
  canResend,
  resendTimer,
  autoFocus = true,
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleOtpChange = (text: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = text.replace(/[^0-9]/g, '').slice(0, 6);
    onChangeText(numericValue);
  };

  return (
    <View style={styles.container}>
      {/* OTP Input */}
      <View style={styles.otpInputWrapper}>
        <OTPIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
        <TextInput
          ref={inputRef}
          style={styles.otpInput}
          placeholder="Enter OTP"
          value={value}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={6}
          placeholderTextColor="#9CA3AF"
          autoFocus={autoFocus}
        />
      </View>

      {/* Resend Code */}
      <View style={styles.resendContainer}>
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Did not receive code? </Text>
          <TouchableOpacity 
            onPress={onResend} 
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 40,
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
});

export default OTPInput;
