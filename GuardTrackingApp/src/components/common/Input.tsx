// Enhanced Input Component — matches auth form field design
import React, { forwardRef, useState } from 'react';
import { ViewStyle, TextStyle, TextInput, TextInputProps } from 'react-native';
import FormInput from './FormInput';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperTextStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon: _rightIcon,
  onRightIconPress,
  containerStyle,
  disabled = false,
  loading = false,
  icon,
  secureTextEntry,
  multiline,
  ...textInputProps
}, ref) => {
  const isPasswordField = secureTextEntry !== undefined;
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
    onRightIconPress?.();
  };

  return (
    <FormInput
      ref={ref}
      label={label}
      icon={icon || leftIcon}
      error={error}
      helperText={helperText}
      required={required}
      containerStyle={containerStyle}
      disabled={disabled || loading}
      secureTextEntry={isPasswordField ? !showPassword : secureTextEntry}
      showPassword={isPasswordField ? showPassword : undefined}
      onTogglePassword={isPasswordField ? handleTogglePassword : undefined}
      multiline={multiline}
      {...textInputProps}
    />
  );
});

Input.displayName = 'Input';

export default Input;
