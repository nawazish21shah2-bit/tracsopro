import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PersonIcon } from '../ui/AppIcons';
import StatusBadge from './StatusBadge';

interface NotificationCardProps {
  notification: {
    id: string;
    guardName: string;
    guardAvatar?: string;
    action: string;
    site: string;
    time?: string;
    status: 'Active';
  };
  onPress?: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          {notification.guardAvatar ? (
            <Image source={{ uri: notification.guardAvatar }} style={styles.avatarImage} />
          ) : (
            <PersonIcon size={24} color="#666" />
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.guardName}>{notification.guardName}</Text>
          <Text style={styles.action}>{notification.action}</Text>
          <Text style={styles.site}>{notification.site}</Text>
        </View>
        <View style={styles.statusContainer}>
          <StatusBadge status={notification.status} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  details: {
    flex: 1,
  },
  guardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  action: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 2,
  },
  site: {
    fontSize: 12,
    color: '#666666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
});

export default NotificationCard;
