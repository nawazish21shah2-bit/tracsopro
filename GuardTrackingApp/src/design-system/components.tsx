/**
 * Reusable Styled Components
 * 
 * These components use the unified design system and should be used
 * throughout the app for consistency.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  CommonStyles,
} from './index';

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const DesignSystemButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      CommonStyles.buttonBase,
      size === 'small' && { height: 40, paddingHorizontal: Spacing.md },
      size === 'large' && { height: Layout.buttonHeightLarge, paddingHorizontal: Spacing.xl },
    ];

    switch (variant) {
      case 'primary':
        baseStyle.push(CommonStyles.buttonPrimary);
        break;
      case 'secondary':
        baseStyle.push(CommonStyles.buttonSecondary);
        break;
      case 'danger':
        baseStyle.push({ backgroundColor: Colors.error });
        break;
      case 'success':
        baseStyle.push({ backgroundColor: Colors.success });
        break;
      case 'outline':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.border.medium,
        });
        break;
    }

    if (disabled || loading) {
      baseStyle.push({ opacity: 0.6 });
    }

    if (fullWidth) {
      baseStyle.push({ width: '100%' });
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [CommonStyles.buttonText];

    if (variant === 'secondary' || variant === 'outline') {
      baseStyle.push({
        color: variant === 'secondary' ? Colors.primary : Colors.text.primary,
      });
    }

    if (size === 'small') {
      baseStyle.push({ fontSize: Typography.fontSize.sm });
    } else if (size === 'large') {
      baseStyle.push({ fontSize: Typography.fontSize.lg });
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'outline' ? Colors.primary : Colors.text.inverse}
          size="small"
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: Spacing.sm }}>{icon}</View>}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const DesignSystemInput: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIcon,
  rightIcon,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.inputWrapper, style]}>
      {label && (
        <Text style={[CommonStyles.textLabel, styles.label]}>{label}</Text>
      )}
      <View
        style={[
          CommonStyles.inputContainer,
          isFocused && CommonStyles.inputFocused,
          error && { borderColor: Colors.error },
          disabled && { opacity: 0.6, backgroundColor: Colors.background.secondary },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[
            CommonStyles.inputText,
            multiline && { textAlignVertical: 'top', minHeight: numberOfLines * 24 },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={[CommonStyles.textCaption, styles.errorText]}>{error}</Text>
      )}
    </View>
  );
};

// ============================================================================
// CARD COMPONENT
// ============================================================================

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
  onPress?: () => void;
}

export const DesignSystemCard: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  style,
  onPress,
}) => {
  const cardStyle = [
    variant === 'elevated' ? CommonStyles.cardElevated : CommonStyles.card,
    onPress && { ...Shadows.sm },
    style,
  ];

  const content = (
    <>
      {title && (
        <View style={styles.cardHeader}>
          <Text style={[CommonStyles.textH4, styles.cardTitle]}>{title}</Text>
          {subtitle && (
            <Text style={[CommonStyles.textBodySmall, styles.cardSubtitle]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const DesignSystemBadge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  style,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: Colors.primaryLight, borderColor: Colors.primary };
      case 'success':
        return { backgroundColor: Colors.successLight, borderColor: Colors.success };
      case 'warning':
        return { backgroundColor: Colors.warningLight, borderColor: Colors.warning };
      case 'error':
        return { backgroundColor: Colors.errorLight, borderColor: Colors.error };
      case 'neutral':
        return { backgroundColor: Colors.gray[100], borderColor: Colors.gray[300] };
      default:
        return { backgroundColor: Colors.primaryLight, borderColor: Colors.primary };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'success':
        return Colors.successDark;
      case 'warning':
        return Colors.warningDark;
      case 'error':
        return Colors.errorDark;
      case 'neutral':
        return Colors.gray[700];
      default:
        return Colors.primary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        getVariantStyle(),
        size === 'small' && styles.badgeSmall,
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: getTextColor() },
          size === 'small' && styles.badgeTextSmall,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  inputWrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    marginTop: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...Typography.textStyles.caption,
    fontWeight: Typography.fontWeight.medium,
  },
  badgeTextSmall: {
    fontSize: Typography.fontSize.xs,
  },
});

