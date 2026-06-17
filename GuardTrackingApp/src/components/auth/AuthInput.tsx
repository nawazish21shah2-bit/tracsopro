import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { AppIcon, EyeIcon, EyeSlashIcon } from '../ui/AppIcons';
import { COLORS } from '../../styles/globalStyles';
import { authInputStyles } from '../../styles/authStyles';

interface AuthInputProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  required?: boolean;
}

const AuthInput = forwardRef<TextInput, AuthInputProps>(({
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
    <View>
      {label && (
        <Text style={authInputStyles.label}>
          {label}
          {required && <Text style={authInputStyles.required}> *</Text>}
        </Text>
      )}

      <View
        style={[
          authInputStyles.inputWrapper,
          focused && authInputStyles.inputFocused,
          error && authInputStyles.inputError,
          style,
        ]}
      >
        {icon && (
          <AppIcon
            type="material"
            name={icon}
            size={20}
            color={COLORS.textSecondary}
            style={authInputStyles.inputIcon}
          />
        )}

        <TextInput
          ref={ref}
          style={authInputStyles.textInput}
          placeholderTextColor={COLORS.textSecondary}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
          secureTextEntry={isPasswordField ? !showPassword : props.secureTextEntry}
        />

        {isPasswordField && onTogglePassword && (
          <TouchableOpacity onPress={onTogglePassword} style={authInputStyles.eyeIcon}>
            {showPassword ? (
              <EyeIcon size={20} color={COLORS.textSecondary} />
            ) : (
              <EyeSlashIcon size={20} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={authInputStyles.errorText}>{error}</Text> : null}
    </View>
  );
});

export default AuthInput;
