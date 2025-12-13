import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { fetchNotifications, markNotificationAsRead, markAllAsRead } from '../../store/slices/notificationSlice';
import apiService from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';
import { NotificationIcon } from '../../components/ui/AppIcons';
import { PersonIcon } from '../../components/ui/AppIcons';

interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

const NotificationListScreen: React.FC<{ variant?: 'client' | 'guard' | 'admin' | 'superAdmin' }> = ({ 
  variant = 'client' 
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount, isLoading } = useSelector((state: RootState) => state.notifications);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await dispatch(fetchNotifications()).unwrap();
      if (__DEV__) {
        console.log('Notifications loaded:', result?.length || 0);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      // Show user-friendly error message
      if (error?.message) {
        console.error('Error details:', error.message);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Mark as read if unread
    if (!notification.isRead) {
      try {
        await dispatch(markNotificationAsRead(notification.id)).unwrap();
        await apiService.markNotificationAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type and data
    if (notification.data) {
      const data = typeof notification.data === 'string' 
        ? JSON.parse(notification.data) 
        : notification.data;

      if (data.shiftId) {
        // Navigate to shift details
        navigation.navigate('ShiftDetails' as never, { shiftId: data.shiftId } as never);
      } else if (data.incidentId) {
        // Navigate to incident details
        navigation.navigate('IncidentDetail' as never, { incidentId: data.incidentId } as never);
      } else if (data.alertId) {
        // Navigate to emergency alert
        navigation.navigate('EmergencyAlert' as never, { alertId: data.alertId } as never);
      } else if (data.conversationId) {
        // Navigate to chat
        navigation.navigate('IndividualChatScreen' as never, {
          chatId: data.conversationId,
          chatName: notification.title,
        } as never);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead());
      await apiService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatNotificationMessage = (notification: NotificationItem): { action: string; site: string } => {
    // Parse the message to extract action and site
    const message = notification.message || '';
    const title = notification.title || '';
    
    // Try to extract site name from message or data
    let site = 'Site';
    if (notification.data) {
      const data = typeof notification.data === 'string' 
        ? JSON.parse(notification.data) 
        : notification.data;
      site = data.siteName || data.site || 'Site';
    }

    // Extract action from message
    let action = message;
    if (message.includes('Checked In')) {
      const timeMatch = message.match(/at (\d{1,2}:\d{2} (am|pm))/i);
      action = timeMatch ? `Checked In at ${timeMatch[1]}` : 'Checked In';
    } else if (message.includes('incident report') || message.includes('Sent an incident report')) {
      action = 'Sent an incident report';
    } else if (message.includes('Checked Out')) {
      const timeMatch = message.match(/at (\d{1,2}:\d{2} (am|pm))/i);
      action = timeMatch ? `Checked Out at ${timeMatch[1]}` : 'Checked Out';
    } else if (message.includes('EMERGENCY')) {
      action = 'Triggered emergency alert';
    }

    return { action, site };
  };

  const getUserName = (notification: NotificationItem): string => {
    if (notification.user) {
      return `${notification.user.firstName} ${notification.user.lastName}`;
    }
    // Fallback: try to extract from message or use default
    const message = notification.message || '';
    const nameMatch = message.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
    return nameMatch ? nameMatch[1] : 'User';
  };

  const getUserAvatar = (notification: NotificationItem): string | undefined => {
    return notification.user?.avatar;
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const { action, site } = formatNotificationMessage(item);
    const userName = getUserName(item);
    const userAvatar = getUserAvatar(item);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.avatarContainer}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <PersonIcon size={24} color={COLORS.textSecondary} />
              </View>
            )}
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.actionText}>{action}</Text>
            <Text style={styles.siteText}>{site}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <NotificationIcon size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>You're all caught up!</Text>
    </View>
  );

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant={variant}
        title="Notification"
        onNotificationPress={() => {
          // Bell icon in header - do nothing (we're already on notifications page)
        }}
        notificationCount={unreadCount}
        rightIcon={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxxxl,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadCard: {
    backgroundColor: '#FAFAFA',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  siteText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  activeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: '#16A34A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  markAllButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  markAllText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default NotificationListScreen;

