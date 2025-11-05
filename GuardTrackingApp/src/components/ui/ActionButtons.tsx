import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { AlertTriangleIcon, AlertCircleIcon, ClockIcon } from './FeatherIcons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../styles/globalStyles';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  variant: 'incident' | 'emergency' | 'checkin' | 'checkout';
  style?: ViewStyle;
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  variant,
  style,
  disabled = false,
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'incident':
        return styles.incidentButton;
      case 'emergency':
        return styles.emergencyButton;
      case 'checkin':
      case 'checkout':
        return styles.checkInButton;
      default:
        return styles.incidentButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'incident':
        return styles.incidentText;
      case 'emergency':
        return styles.emergencyText;
      case 'checkin':
      case 'checkout':
        return styles.checkInText;
      default:
        return styles.incidentText;
    }
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconColor = variant === 'incident' ? COLORS.info : 
                     variant === 'emergency' ? COLORS.textInverse : 
                     COLORS.textInverse;

    switch (variant) {
      case 'incident':
        return <AlertTriangleIcon size={iconSize} color={iconColor} style={styles.iconMargin} />;
      case 'emergency':
        return <AlertCircleIcon size={iconSize} color={iconColor} style={styles.iconMargin} />;
      case 'checkin':
      case 'checkout':
        return <ClockIcon size={iconSize} color={iconColor} style={styles.iconMargin} />;
      default:
        return <AlertTriangleIcon size={iconSize} color={iconColor} style={styles.iconMargin} />;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {getIcon()}
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

interface ActionButtonGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({ children, style }) => {
  return <View style={[styles.buttonGroup, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  iconMargin: {
    marginRight: SPACING.sm,
  },
  disabled: {
    opacity: 0.6,
  },
  // Incident Button
  incidentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  incidentText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500' as const,
    color: '#1976D2',
  },
  // Emergency Button
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  emergencyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500' as const,
    color: COLORS.textInverse,
  },
  // Check In/Out Button
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
  },
  checkInText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600' as const,
    color: COLORS.textInverse,
  },
});

export default { ActionButton, ActionButtonGroup };
