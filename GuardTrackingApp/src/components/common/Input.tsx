// Enhanced Input Component with Validation and Accessibility
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../utils/theme';

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
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required = false,
  variant = 'default',
  size = 'medium',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperTextStyle,
  disabled = false,
  loading = false,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { theme } = useTheme();

  const getContainerStyle = () => {
    const baseStyle: any[] = [styles.container, styles[`${variant}Container`]];
    
    if (isFocused) {
      baseStyle.push({
        borderColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
      });
    }
    
    if (error) {
      baseStyle.push({ borderColor: theme.colors.danger });
    }
    
    if (disabled || loading) {
      baseStyle.push({ backgroundColor: theme.colors.gray[100], opacity: 0.6 });
    }
    
    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle: any[] = [styles.input, styles[`${size}Input`]];
    
    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon);
    }
    
    if (rightIcon) {
      baseStyle.push(styles.inputWithRightIcon);
    }
    
    return baseStyle;
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View style={[containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, { color: theme.colors.text.primary }, labelStyle]}>
          {label}
          {required && <Text style={[styles.required, { color: theme.colors.danger }]}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View style={[getContainerStyle(), { borderRadius: theme.borderRadius.md }]}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Text style={[styles.icon, { color: theme.colors.gray[500] }]}>{leftIcon}</Text>
          </View>
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[getInputStyle(), { color: theme.colors.text.primary }, inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled && !loading}
          placeholderTextColor={theme.colors.gray[400]}
          {...textInputProps}
        />

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={disabled || loading}
          >
            <Text style={[styles.icon, { color: theme.colors.gray[500] }]}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text */}
      {helperText && !error && (
        <Text style={[styles.helperText, { color: theme.colors.gray[500] }, helperTextStyle]}>
          {helperText}
        </Text>
      )}

      {/* Error Message */}
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.danger }, errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  
  // Label styles
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
  },
  
  // Container variants
  defaultContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  outlinedContainer: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  filledContainer: {
    borderWidth: 0,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  
  // Focus and error states
  focused: {},
  errorContainer: {},
  disabledContainer: {},
  
  // Input styles
  input: {
    paddingHorizontal: 16,
    fontSize: 16,
    flex: 1,
  },
  
  // Input sizes
  smallInput: {
    paddingVertical: 8,
    fontSize: 14,
  },
  mediumInput: {
    paddingVertical: 12,
    fontSize: 16,
  },
  largeInput: {
    paddingVertical: 16,
    fontSize: 18,
  },
  
  // Icon styles
  leftIconContainer: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconContainer: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  
  // Input with icons
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  
  // Helper and error text
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;