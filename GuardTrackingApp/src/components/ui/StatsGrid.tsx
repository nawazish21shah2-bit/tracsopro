import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { SPACING } from '../../styles/globalStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Width for a single stat card in a 2-column grid with standard inset padding. */
export const STAT_CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm) / 2;

export const statCardStyle = {
  width: STAT_CARD_WIDTH,
  flexGrow: 0,
  flexShrink: 0,
};

interface StatsGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Apply horizontal padding matching dashboard screens. Default true. */
  inset?: boolean;
}

const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  style,
  contentStyle,
  inset = true,
}) => (
  <View style={[inset && styles.inset, style]}>
    <View style={[styles.grid, contentStyle]}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  inset: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
});

export default StatsGrid;
