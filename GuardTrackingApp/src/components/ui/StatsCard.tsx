import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';

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
      return { bg: '#E8F8EC', iconBg: '#D4F5DD', iconBorder: '#4CAF50' };
    case 'danger':
      return { bg: '#FDECEC', iconBg: '#FAD7D7', iconBorder: '#F44336' };
    case 'info':
      return { bg: '#E8F1FD', iconBg: '#D5E3FB', iconBorder: '#1C6CA9' };
    default:
      return { bg: '#F5F5F5', iconBg: '#E8E8E8', iconBorder: '#B0B0B0' };
  }
};

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, variant = 'neutral', style }) => {
  const colors = getVariantColors(variant);

  return (
    <View style={[styles.card, { backgroundColor: colors.bg }, style]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.iconBg, borderColor: colors.iconBorder }]}> 
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundPrimary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: '500',
    flexWrap: 'wrap',
    
  },
  value: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: '700',
  },
});

export default StatsCard;
