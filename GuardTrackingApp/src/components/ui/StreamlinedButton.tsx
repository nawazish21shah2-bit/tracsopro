import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { getButtonStyle, getTextStyle, UI_COLORS } from '../../styles/uiStyles';

interface StreamlinedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'disabled';
  isActive?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const StreamlinedButton: React.FC<StreamlinedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isActive = false,
  icon,
  disabled = false,
  fullWidth = false,
  size = 'medium',
}) => {
  const buttonVariant = disabled ? 'disabled' : isActive ? 'primary' : variant;
  const textVariant = disabled ? 'disabled' : isActive ? 'active' : 'primary';
  
  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 12 },
    medium: { paddingVertical: 12, paddingHorizontal: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 24 },
  };

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(buttonVariant),
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isActive && styles.activeButton,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}
      <Text style={[getTextStyle(textVariant), styles.buttonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  activeButton: {
    backgroundColor: UI_COLORS.primary,
    borderColor: UI_COLORS.primary,
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    textAlign: 'center',
  },
});

export default StreamlinedButton;
