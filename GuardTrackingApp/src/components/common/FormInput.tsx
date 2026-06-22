import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { AppIcon, EyeIcon, EyeSlashIcon } from '../ui/AppIcons';
import { COLORS } from '../../styles/globalStyles';
import { authInputStyles } from '../../styles/authStyles';

export interface FormInputProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string;
  helperText?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  required?: boolean;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

const FormInput = forwardRef<TextInput, FormInputProps>(({
  label,
  icon,
  error,
  helperText,
  showPassword,
  onTogglePassword,
  required = false,
  containerStyle,
  disabled = false,
  style,
  multiline,
  editable,
  ...props
}, ref) => {
  const isPasswordField = props.secureTextEntry !== undefined;
  const [focused, setFocused] = useState(false);
  const isDisabled = disabled || editable === false;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={authInputStyles.label}>
          {label}
          {required ? <Text style={authInputStyles.required}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          authInputStyles.inputWrapper,
          multiline && styles.multilineWrapper,
          focused && authInputStyles.inputFocused,
          error && authInputStyles.inputError,
          isDisabled && styles.disabledWrapper,
          style,
        ]}
      >
        {icon ? (
          <AppIcon
            type="material"
            name={icon}
            size={20}
            color={COLORS.textSecondary}
            style={authInputStyles.inputIcon}
          />
        ) : null}

        <TextInput
          ref={ref}
          style={[
            authInputStyles.textInput,
            multiline && styles.multilineInput,
          ]}
          placeholderTextColor={COLORS.textSecondary}
          editable={!isDisabled}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
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

        {isPasswordField && onTogglePassword ? (
          <TouchableOpacity onPress={onTogglePassword} style={authInputStyles.eyeIcon}>
            {showPassword ? (
              <EyeIcon size={20} color={COLORS.textSecondary} />
            ) : (
              <EyeSlashIcon size={20} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? <Text style={authInputStyles.errorText}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
});

FormInput.displayName = 'FormInput';

const styles = StyleSheet.create({
  multilineWrapper: {
    height: undefined,
    minHeight: 112,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 88,
    paddingVertical: 4,
  },
  disabledWrapper: {
    opacity: 0.65,
    backgroundColor: COLORS.backgroundSecondary,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default FormInput;
