import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { MessageCircle } from 'react-native-feather';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

interface ChatInitiationButtonProps {
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
}

const ChatInitiationButton: React.FC<ChatInitiationButtonProps> = ({
  onPress,
  size = 'medium',
  variant = 'primary',
}) => {
  const sizeStyles = {
    small: { padding: SPACING.xs, iconSize: 16 },
    medium: { padding: SPACING.sm, iconSize: 20 },
    large: { padding: SPACING.md, iconSize: 24 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    secondary: {
      backgroundColor: COLORS.secondary,
      borderColor: COLORS.secondary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: COLORS.primary,
    },
  };

  const currentSize = sizeStyles[size];
  const currentVariant = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          padding: currentSize.padding,
          backgroundColor: currentVariant.backgroundColor,
          borderColor: currentVariant.borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MessageCircle
        width={currentSize.iconSize}
        height={currentSize.iconSize}
        color={variant === 'outline' ? COLORS.primary : COLORS.white}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatInitiationButton;





