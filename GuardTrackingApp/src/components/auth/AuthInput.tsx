import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { AppIcon, EyeIcon, EyeSlashIcon } from '../ui/AppIcons';

interface AuthInputProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  required?: boolean;
}

const AuthInput = forwardRef<TextInput, AuthInputProps> (({
  label,
  icon,
  error,
  showPassword,
  onTogglePassword,
  required = false,
  style,
  ...props
}, ref) => {
  const isPasswordField = props.secureTextEntry !== undefined;
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
      >
        {icon && (
          <AppIcon type="material" name={icon} size={20} color="#9CA3AF" style={styles.inputIcon} />
        )}
        
        <TextInput
          ref={ref}
          style={styles.textInput}
          placeholderTextColor="#828282"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
          secureTextEntry={isPasswordField ? !showPassword : props.secureTextEntry}
        />
        
        {isPasswordField && onTogglePassword && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
            {showPassword ? (
              <EyeIcon size={20} color="#9CA3AF" />
            ) : (
              <EyeSlashIcon size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // Margin handled by parent inputContainer
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#828282',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Light gray background as per design
    borderWidth: 1,
    borderColor: '#ACD3F1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputFocused: {
    borderColor: '#1C6CA9',
    borderWidth: 1, // Keep border width consistent
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AuthInput;
