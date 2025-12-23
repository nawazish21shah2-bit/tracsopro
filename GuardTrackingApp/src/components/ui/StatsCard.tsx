import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'success' | 'danger' | 'info' | 'neutral';
  style?: ViewStyle;
  twoLineLabel?: boolean; // Optional prop to enable two-line label (each word per line)
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

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, variant = 'neutral', style, twoLineLabel = false }) => {
  const colors = getVariantColors(variant);
  
  // Split label into words for two-line display only if twoLineLabel prop is true
  const labelWords = twoLineLabel ? label.split(' ') : [label];

  return (
    <View style={[styles.card, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
          {icon}
        </View>
      )}
      <View style={styles.textContainer}>
        {twoLineLabel ? (
          labelWords.map((word, index) => (
            <Text key={index} style={styles.label} numberOfLines={1} ellipsizeMode="clip">
              {word}
            </Text>
          ))
        ) : (
          <Text style={styles.label} numberOfLines={2}>{label}</Text>
        )}
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
    minHeight: 80,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
    minWidth: 0, // Allow flex to shrink if needed, but prevent truncation
  },
  label: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: '#7A7A7A',
    lineHeight: 16,
    letterSpacing: -0.41,
    flexShrink: 0, // Prevent individual words from being truncated
  },
  value: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#323232',
    lineHeight: 29,
    textAlign: 'right',
    flexShrink: 0, // Prevent shrinking to ensure full value is visible
    minWidth: 60, // Minimum width to accommodate values like "8.5 min"
  },
});

export default StatsCard;
