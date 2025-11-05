import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: 'Active' | 'Upcoming' | 'Missed' | 'Completed' | 'New' | 'Reviewed' | 'Respond';
  size?: 'small' | 'medium';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'Active':
        return {
          backgroundColor: '#E8F5E8',
          color: '#2E7D32',
        };
      case 'Upcoming':
        return {
          backgroundColor: '#E3F2FD',
          color: '#1976D2',
        };
      case 'Missed':
        return {
          backgroundColor: '#FFEBEE',
          color: '#D32F2F',
        };
      case 'Completed':
        return {
          backgroundColor: '#E8F5E8',
          color: '#2E7D32',
        };
      case 'New':
        return {
          backgroundColor: '#E3F2FD',
          color: '#1976D2',
        };
      case 'Reviewed':
        return {
          backgroundColor: '#F3E5F5',
          color: '#7B1FA2',
        };
      case 'Respond':
        return {
          backgroundColor: '#FFEBEE',
          color: '#D32F2F',
        };
      default:
        return {
          backgroundColor: '#F5F5F5',
          color: '#757575',
        };
    }
  };

  const statusStyle = getStatusStyle();
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: statusStyle.backgroundColor },
      isSmall && styles.badgeSmall
    ]}>
      <Text style={[
        styles.badgeText,
        { color: statusStyle.color },
        isSmall && styles.badgeTextSmall
      ]}>
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeTextSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default StatusBadge;
