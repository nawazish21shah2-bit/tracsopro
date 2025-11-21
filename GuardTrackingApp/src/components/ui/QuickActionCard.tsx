import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { TYPOGRAPHY } from '../../styles/globalStyles';
import { ChevronRightIcon } from './AppIcons';

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor: string;
  onPress: () => void;
  style?: ViewStyle;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon,
  iconBgColor,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      
      <View style={styles.chevronContainer}>
        <ChevronRightIcon size={24} color="#7A7A7A" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    // Drop shadow: X 0, Y 2, Blur 4, Spread 2, Color #000000 at 6% opacity
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
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
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: '#000000',
    lineHeight: 17,
    letterSpacing: -0.41,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: '#7A7A7A',
    lineHeight: 15,
    letterSpacing: -0.41,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default QuickActionCard;

