import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TYPOGRAPHY } from '../../styles/globalStyles';

interface AdminStatsCardProps {
  label: string;
  value: string | number;
  subLabel: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  style?: ViewStyle;
}

const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  label,
  value,
  subLabel,
  icon,
  iconBgColor,
  iconColor,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          {icon}
        </View>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
        <Text style={styles.subLabel}>{subLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    backgroundColor: '#FFFFFF',
    // Drop shadow: X 0, Y 4, Blur 4, Spread 0, Color DCDCDC at 25% opacity
    shadowColor: '#DCDCDC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 94,
    minWidth: 166,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  value: {
    flex: 1,
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: '#000000',
    lineHeight: 24,
    letterSpacing: -0.41,
    marginLeft: 46, // icon width (36) + marginRight (10) = 46
  },
  textContainer: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: '#7A7A7A',
    lineHeight: 14,
    letterSpacing: -0.41,
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: '#16A34A',
    lineHeight: 13,
    letterSpacing: -0.41,
  },
});

export default AdminStatsCard;

