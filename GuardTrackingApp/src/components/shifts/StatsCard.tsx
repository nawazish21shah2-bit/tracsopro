import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface StatsCardProps {
  number: number;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ number, label, color, icon }) => {
  return (
    <View style={[styles.container, { backgroundColor: `${color}15` }]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.number, { color }]}>{number}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  iconContainer: {
    marginBottom: SPACING.xs,
  },
  number: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
});

export default StatsCard;
