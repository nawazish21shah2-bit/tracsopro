import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../styles/globalStyles';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'success' | 'danger' | 'info' | 'neutral' | 'warning';
  style?: ViewStyle;
  /** Split label into one word per line (used in compact ops grids). */
  twoLineLabel?: boolean;
  /** Secondary line below label (admin dashboard style). */
  subLabel?: string;
  /** Horizontal = icon + label + value; vertical = icon/value row + label stack. */
  layout?: 'horizontal' | 'vertical';
}

const getVariantColors = (variant: StatsCardProps['variant']) => {
  switch (variant) {
    case 'success':
      return { iconBg: '#DCFCE7', accent: COLORS.success };
    case 'danger':
      return { iconBg: '#FEE2E2', accent: COLORS.error };
    case 'info':
      return { iconBg: '#DBEAFE', accent: COLORS.info };
    case 'warning':
      return { iconBg: '#FEF3C7', accent: COLORS.warning };
    default:
      return { iconBg: '#F3F4F6', accent: COLORS.textSecondary };
  }
};

const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  variant = 'neutral',
  style,
  twoLineLabel = false,
  subLabel,
  layout = 'horizontal',
}) => {
  const colors = getVariantColors(variant);
  const labelWords = twoLineLabel ? label.split(' ') : [label];

  if (layout === 'vertical') {
    return (
      <View style={[styles.card, styles.cardVertical, { borderLeftColor: colors.accent }, style]}>
        <View style={styles.verticalTopRow}>
          {icon ? (
            <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>{icon}</View>
          ) : (
            <View style={styles.iconSpacer} />
          )}
          <Text style={styles.verticalValue} numberOfLines={1}>
            {value}
          </Text>
        </View>
        <View style={styles.verticalTextContainer}>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {subLabel ? (
            <Text style={[styles.subLabel, { color: colors.accent }]} numberOfLines={1}>
              {subLabel}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderLeftColor: colors.accent }, style]}>
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>{icon}</View>
      )}
      <View style={styles.textContainer}>
        {twoLineLabel ? (
          labelWords.map((word, index) => (
            <Text key={index} style={styles.label} numberOfLines={1} ellipsizeMode="clip">
              {word}
            </Text>
          ))
        ) : (
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        )}
        {subLabel ? (
          <Text style={[styles.subLabel, { color: colors.accent }]} numberOfLines={1}>
            {subLabel}
          </Text>
        ) : null}
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderLeftWidth: 3,
    backgroundColor: COLORS.backgroundPrimary,
    ...SHADOWS.small,
    minHeight: 80,
  },
  cardVertical: {
    flexDirection: 'column',
    alignItems: 'stretch',
    minHeight: 94,
    padding: SPACING.sm,
  },
  verticalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.sm,
  },
  verticalTextContainer: {
    flexDirection: 'column',
  },
  verticalValue: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    lineHeight: 24,
    letterSpacing: -0.41,
    textAlign: 'right',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  iconSpacer: {
    width: 36,
    height: 36,
    marginRight: SPACING.sm,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: SPACING.xs,
    minWidth: 0,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: COLORS.textSecondary,
    lineHeight: 16,
    letterSpacing: -0.41,
    flexShrink: 1,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    lineHeight: 13,
    letterSpacing: -0.41,
    marginTop: 2,
  },
  value: {
    fontSize: 22,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    lineHeight: 29,
    textAlign: 'right',
    flexShrink: 0,
    marginLeft: 'auto',
  },
});

export default StatsCard;
