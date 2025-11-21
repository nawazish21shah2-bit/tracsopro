import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { TYPOGRAPHY } from '../../styles/globalStyles';

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
    backgroundColor: '#F5F5F7', // Static background color for all icons
    // Different shadow for each activity type
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  activityText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: '#000000',
    lineHeight: 17,
    letterSpacing: -0.41,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: '#7A7A7A',
    lineHeight: 15,
    letterSpacing: -0.41,
  },
});

export default RecentActivityCard;

