import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../../store/slices/notificationSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '../../styles/globalStyles';
import { NotificationIcon } from '../../components/ui/AppIcons';
import { TrashIcon } from '../../components/ui/FeatherIcons';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { parseDisplayName } from '../../utils/parseDisplayName';
import { pickProfilePictureUrl } from '../../utils/profilePictureUtils';
import { useRoleScreenHeader, RoleHeaderVariant } from '../../hooks/useRoleScreenHeader';

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
    profilePictureUrl?: string;
  };
}

const NotificationListScreen: React.FC<{ variant?: 'client' | 'guard' | 'admin' | 'superAdmin' }> = ({ 
  variant = 'client' 
}) => {
  const navigation = useNavigation<StackNavigationProp<SettingsStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const roleVariant: RoleHeaderVariant =
    variant === 'superAdmin'
      ? 'superAdmin'
      : variant === 'admin'
        ? 'admin'
        : variant === 'guard'
          ? 'guard'
          : 'client';
  const { headerProps } = useRoleScreenHeader('Notifications', roleVariant);
  const { notifications, unreadCount, isLoading, error } = useSelector((state: RootState) => state.notifications);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    try {
      const result = await dispatch(
        fetchNotifications({ unreadOnly: filter === 'unread' })
      ).unwrap();
      if (__DEV__) {
        console.log('Notifications loaded:', result?.notifications?.length || 0);
      }
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      if (error?.message) {
        console.error('Error details:', error.message);
      }
    }
  }, [dispatch, filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const parseNotificationData = (raw: unknown): Record<string, unknown> => {
    if (!raw) return {};
    if (typeof raw === 'object') return raw as Record<string, unknown>;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return {};
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Mark as read if unread (optimized - only dispatch, API call handled by thunk)
    if (!notification.isRead) {
      try {
        await dispatch(markNotificationAsRead(notification.id)).unwrap();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type and data
    const data = parseNotificationData(notification.data);

    // Navigation map for cleaner routing
    const navigationTargets: Array<{ screen: string; params: any }> = [];
    
    if (data.shiftId) {
      navigationTargets.push({ screen: 'ShiftDetails', params: { shiftId: data.shiftId } });
    } else if (data.incidentId) {
      navigationTargets.push({ screen: 'IncidentDetail', params: { incidentId: data.incidentId } });
    } else if (data.alertId) {
      navigationTargets.push({ screen: 'SupportHubScreen', params: { mode: 'mine' } });
    } else if (data.conversationId) {
      navigationTargets.push({ 
        screen: 'IndividualChatScreen', 
        params: { chatId: data.conversationId, chatName: notification.title } 
      });
    } else if (data.ticketId) {
      navigationTargets.push({
        screen: 'SupportTicketDetailScreen',
        params: { ticketId: data.ticketId },
      });
    } else if (data.chatId) {
      navigationTargets.push({
        screen: 'IndividualChatScreen',
        params: { chatId: data.chatId, chatName: notification.title },
      });
    }

    // Navigate to first valid target
    if (navigationTargets.length > 0) {
      const navTarget = navigationTargets[0];
      (navigation as any).navigate(navTarget.screen, navTarget.params);
    }
  };

  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      await dispatch(markAllNotificationsAsRead()).unwrap();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [dispatch, unreadCount]);

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await dispatch(deleteNotification(notificationId)).unwrap();
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
    },
    [dispatch]
  );

  const handleClearAll = useCallback(() => {
    if (notifications.length === 0) return;

    Alert.alert(
      'Clear all notifications?',
      'This will permanently remove all notifications from your inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearAllNotifications()).unwrap();
            } catch (err) {
              console.error('Error clearing notifications:', err);
            }
          },
        },
      ]
    );
  }, [dispatch, notifications.length]);

  const formatNotificationMessage = useCallback((notification: NotificationItem): { action: string; site: string } => {
    const message = notification.message || '';
    const data = parseNotificationData(notification.data);

    // Extract site name
    const site = data.siteName || data.site || data.locationName || 'Site';

    // Extract action from message or type
    const actionPatterns: Array<{ pattern: RegExp | string; action: string }> = [
      { pattern: /checked in/i, action: message.match(/at (\d{1,2}:\d{2} (am|pm))/i) 
        ? `Checked In at ${message.match(/at (\d{1,2}:\d{2} (am|pm))/i)![1]}` 
        : 'Checked In' },
      { pattern: /checked out/i, action: message.match(/at (\d{1,2}:\d{2} (am|pm))/i) 
        ? `Checked Out at ${message.match(/at (\d{1,2}:\d{2} (am|pm))/i)![1]}` 
        : 'Checked Out' },
      { pattern: /incident report/i, action: 'Sent an incident report' },
      { pattern: /emergency/i, action: 'Triggered emergency alert' },
      { pattern: /shift assigned/i, action: 'Shift assigned' },
      { pattern: /shift cancelled/i, action: 'Shift cancelled' },
    ];

    const matchedPattern = actionPatterns.find(({ pattern }) => 
      typeof pattern === 'string' ? message.toLowerCase().includes(pattern) : pattern.test(message)
    );

    return { 
      action: matchedPattern?.action || message || notification.title || 'Notification',
      site 
    };
  }, []);

  const getUserName = useCallback((notification: NotificationItem): string => {
    if (notification.user) {
      return `${notification.user.firstName} ${notification.user.lastName}`.trim();
    }
    // Fallback: try to extract from message or use default
    const message = notification.message || '';
    const nameMatch = message.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
    return nameMatch ? nameMatch[1] : 'User';
  }, []);

  const getUserAvatar = useCallback((notification: NotificationItem): string | undefined => {
    return pickProfilePictureUrl(notification.user);
  }, []);

  const renderNotificationItem = useCallback(({ item }: { item: NotificationItem }) => {
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
            <ProfileAvatar
              firstName={userName.split(' ')[0]}
              lastName={userName.split(' ').slice(1).join(' ')}
              profilePictureUrl={userAvatar}
              size={48}
            />
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.userName}>{item.title || userName}</Text>
            <Text style={styles.actionText}>{action}</Text>
            <Text style={styles.siteText}>{site}</Text>
          </View>
          <View style={styles.statusContainer}>
            {!item.isRead ? (
              <View style={styles.unreadDot} />
            ) : null}
            <TouchableOpacity
              onPress={() => handleDeleteNotification(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.deleteButton}
            >
              <TrashIcon size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [
    formatNotificationMessage,
    getUserName,
    getUserAvatar,
    handleNotificationPress,
    handleDeleteNotification,
  ]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <NotificationIcon size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        {error ? 'Could not load notifications. Pull to refresh.' : "You're all caught up!"}
      </Text>
    </View>
  ), [error]);

  return (
    <SafeAreaWrapper>
      <SharedHeader
        {...headerProps}
        rightIcon={<View style={styles.headerRightSpacer} />}
      />
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterChipText, filter === 'unread' && styles.filterChipTextActive]}>
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
        {(unreadCount > 0 || notifications.length > 0) ? (
          <View style={styles.bulkActions}>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.bulkActionButton}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            ) : null}
            {notifications.length > 0 ? (
              <TouchableOpacity onPress={handleClearAll} style={styles.bulkActionButton}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications.map(n => ({
            ...n,
            createdAt: typeof n.createdAt === 'string' ? n.createdAt : n.createdAt.toISOString(),
          }))}
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
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
    gap: SPACING.md,
  },
  avatarContainer: {
    flexShrink: 0,
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
    minWidth: 0,
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
    gap: SPACING.sm,
    flexShrink: 0,
    marginLeft: SPACING.xs,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toolbar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bulkActionButton: {
    paddingVertical: SPACING.xs,
  },
  headerRightSpacer: {
    width: 40,
    height: 40,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  clearAllText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error || '#DC2626',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
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

