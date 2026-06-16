import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FeatherIcon } from '../ui/FeatherIcons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

/** Feather icon names used in bottom tab navigators */
export type TabFeatherIconName =
  | 'home'
  | 'activity'
  | 'user'
  | 'fileText'
  | 'settings'
  | 'calendar'
  | 'mapPin'
  | 'messageCircle'
  | 'checkCircle'
  | 'barChart'
  | 'briefcase'
  | 'alertTriangle';

interface TabBarIconProps {
  name: TabFeatherIconName;
  focused: boolean;
  size?: number;
}

/**
 * Outline Feather tab icon — matches Operations Center view tabs (stroke, not filled SVG).
 */
const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused, size = 20 }) => {
  const color = focused ? COLORS.primary : COLORS.textSecondary;

  return (
    <View style={[styles.wrapper, focused && styles.wrapperActive]}>
      <FeatherIcon name={name} size={size} color={color} strokeWidth={2} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
  },
  wrapperActive: {
    backgroundColor: COLORS.primaryLight,
  },
});

export default TabBarIcon;
