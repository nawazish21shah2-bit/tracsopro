import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { AppIcon } from '../ui/AppIcons';
import { COLORS } from '../../styles/globalStyles';
import { authInputStyles } from '../../styles/authStyles';

interface AuthOtpInputProps extends TextInputProps {
  error?: string;
}

const AuthOtpInput = forwardRef<TextInput, AuthOtpInputProps>(({
  error,
  style,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <View
        style={[
          authInputStyles.inputWrapper,
          focused && authInputStyles.inputFocused,
          error && authInputStyles.inputError,
          style,
        ]}
      >
        <AppIcon
          type="material"
          name="lock-outline"
          size={20}
          color={COLORS.textSecondary}
          style={authInputStyles.inputIcon}
        />
        <TextInput
          ref={ref}
          style={[authInputStyles.textInput, { letterSpacing: 2 }]}
          placeholder="Enter OTP"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="number-pad"
          maxLength={6}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error ? <Text style={authInputStyles.errorText}>{error}</Text> : null}
    </View>
  );
});

export default AuthOtpInput;
