import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: 'success' | 'danger' | 'info' | 'neutral';
  style?: ViewStyle;
}

const getVariantColors = (variant: StatsCardProps['variant']) => {
  switch (variant) {
    case 'success':
      return { iconBg: '#DCFCE7', iconColor: '#16A34A' }; // Green
    case 'danger':
      return { iconBg: '#FEE2E2', iconColor: '#DC2626' }; // Red
    case 'info':
      return { iconBg: '#DBEAFE', iconColor: '#1976D2' }; // Blue
    default:
      return { iconBg: '#F3F4F6', iconColor: '#6B7280' }; // Gray
  }
};

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, variant = 'neutral', style }) => {
  const colors = getVariantColors(variant);

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    backgroundColor: COLORS.backgroundPrimary,
    // Drop shadow: X 0, Y 4, Blur 4, Spread 0, Color DCDCDC at 25% opacity
    shadowColor: '#DCDCDC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 58,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: '#7A7A7A',
    lineHeight: 14,
    letterSpacing: -0.41,
  },
  value: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    lineHeight: 29,
  },
});

export default StatsCard;
