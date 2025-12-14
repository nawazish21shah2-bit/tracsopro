// Reusable Button Component
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Insets,
  View,
} from 'react-native';
import { useTheme } from '../../utils/theme';
import { ArrowUpOutlineIcon } from '../ui/AppIcons';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  showArrow?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  hitSlop?: Insets;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  showArrow = true,
  style,
  textStyle,
  fullWidth = false,
  hitSlop,
}) => {
  const { theme } = useTheme();
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    }
    
    const variantStyle: any = {
      backgroundColor: '#1C6CA9',
      borderColor: '#1C6CA9',
    };
    if (variant === 'secondary') {
      variantStyle.backgroundColor = 'transparent';
      variantStyle.borderColor = '#1C6CA9';
    } else if (variant === 'danger') {
      variantStyle.backgroundColor = '#DC2626';
      variantStyle.borderColor = '#DC2626';
    } else if (variant === 'success') {
      variantStyle.backgroundColor = '#10B981';
      variantStyle.borderColor = '#10B981';
    } else if (variant === 'warning') {
      variantStyle.backgroundColor = '#F59E0B';
      variantStyle.borderColor = '#F59E0B';
    }
    baseStyle.push(variantStyle);
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text, styles[`${size}Text`]];
    
    if (disabled || loading) {
      baseTextStyle.push(styles.disabledText);
    }
    
    const variantTextStyle: any = {
      color: '#FFFFFF',
    };
    if (variant === 'secondary') {
      variantTextStyle.color = '#1C6CA9';
    }
    baseTextStyle.push(variantTextStyle);
    
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={hitSlop}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          testID="loading-indicator"
          color={variant === 'secondary' ? '#1C6CA9' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {showArrow && (
            <ArrowUpOutlineIcon
              size={20}
              color={variant === 'secondary' ? '#1C6CA9' : '#FFFFFF'}
              style={styles.arrowIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 0,
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  
  // Sizes
  small: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 52,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  
  // Variants
  primary: {
    backgroundColor: '#1C6CA9', // Using app primary color
    borderColor: '#1C6CA9',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: '#1C6CA9', // App primary color
  },
  danger: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  success: {
    backgroundColor: '#00C851',
    borderColor: '#00C851',
  },
  warning: {
    backgroundColor: '#FF8800',
    borderColor: '#FF8800',
  },
  
  // Text styles
  text: {
    fontFamily: 'Inter',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.408,
  },
  smallText: {
    fontSize: 14,
    lineHeight: 17,
  },
  mediumText: {
    fontSize: 16,
    lineHeight: 22,
  },
  largeText: {
    fontSize: 18,
    lineHeight: 24,
  },
  
  // Text colors
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#1C6CA9', // Using app primary color
  },
  dangerText: {
    color: '#ffffff',
  },
  successText: {
    color: '#ffffff',
  },
  warningText: {
    color: '#ffffff',
  },
  disabledText: {
    opacity: 0.6,
  },
  
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  arrowIcon: {
    position: 'absolute',
    right: 20,
  },
});

export default Button;
