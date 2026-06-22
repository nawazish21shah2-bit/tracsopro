import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ChevronLeftIcon } from '../ui/FeatherIcons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';

interface BackNavButtonProps {
  onPress: () => void;
  label?: string;
  iconOnly?: boolean;
  size?: number;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const BackNavButton: React.FC<BackNavButtonProps> = ({
  onPress,
  label = 'Back',
  iconOnly = false,
  size = 22,
  color = COLORS.primary,
  style,
  textStyle,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.container, iconOnly && styles.iconOnly, style]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled}
  >
    <ChevronLeftIcon size={size} color={color} />
    {!iconOnly && label ? (
      <Text style={[styles.label, { color }, textStyle]}>{label}</Text>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  iconOnly: {
    gap: 0,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default BackNavButton;
