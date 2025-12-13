import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface RecentActivityCardProps {
  text: string;
  time: string;
  icon: React.ReactNode;
  iconColor: string;
  shadowColor?: string;
  style?: ViewStyle;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  text,
  time,
  icon,
  iconColor,
  shadowColor = '#000000',
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={[
        styles.iconContainer,
        {
          shadowColor: shadowColor,
        }
      ]}>
        {icon}
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.activityText}>{text}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 66,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    // Border only, no shadow for minimal style
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    // No shadow for minimal style
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  activityText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    lineHeight: 17,
    letterSpacing: -0.41,
    marginBottom: SPACING.xs,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: COLORS.textSecondary,
    lineHeight: 15,
    letterSpacing: -0.41,
  },
});

export default RecentActivityCard;

