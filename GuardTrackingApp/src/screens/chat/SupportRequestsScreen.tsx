import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import SharedHeader from '../../components/ui/SharedHeader';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import SuperAdminProfileDrawer from '../../components/superAdmin/SuperAdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { RootState } from '../../store';
import apiService from '../../services/api';
import { EmptyState, ErrorState, InlineLoading } from '../../components/ui/LoadingStates';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { parseDisplayName } from '../../utils/parseDisplayName';
import { getAdminSupportChatParams } from '../../utils/chatHelper';
import { MessageCircle, Headphones } from 'react-native-feather';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface SupportChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  adminUserId?: string;
}

const SupportRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: isSuperAdmin ? 'SuperAdminNotifications' : 'AdminNotifications',
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<SupportChatItem[]>([]);
  const [opening, setOpening] = useState(false);

  const mapChat = (chat: any): SupportChatItem => ({
    id: chat.id,
    name: chat.name || (isSuperAdmin ? 'Admin Support Request' : 'Platform Support'),
    lastMessage: chat.lastMessage?.content || '',
    timestamp: chat.lastMessageAt ? formatRelativeTime(new Date(chat.lastMessageAt)) : '',
    unreadCount: chat.unreadCount || 0,
    adminUserId: chat.metadata?.adminUserId,
  });

  const loadSupportChats = useCallback(async () => {
    try {
      setError(null);
      const response = await apiService.getSupportChats();
      if (!response.success) {
        setError(response.message || 'Failed to load support chats');
        setChats([]);
        return;
      }
      setChats((response.data || []).map(mapChat));
    } catch (err: any) {
      setError(err?.message || 'Failed to load support chats');
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useFocusEffect(
    useCallback(() => {
      loadSupportChats();
    }, [loadSupportChats]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSupportChats();
    setRefreshing(false);
  };

  const openChat = (chat: SupportChatItem) => {
    navigation.navigate('IndividualChatScreen', {
      chatId: chat.id,
      chatName: chat.name,
      context: 'support',
    });
  };

  const handleAdminContactSupport = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      setOpening(true);
      const response = await apiService.openSupportChat();
      if (response.success && response.data) {
        navigation.navigate('IndividualChatScreen', {
          chatId: response.data.id,
          chatName: response.data.name || 'Platform Support',
          context: 'support',
        });
        await loadSupportChats();
        return;
      }

      const fallback = getAdminSupportChatParams(user.id);
      navigation.navigate('IndividualChatScreen', {
        ...fallback,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to open support chat');
    } finally {
      setOpening(false);
    }
  };

  const renderChatItem = ({ item }: { item: SupportChatItem }) => {
    const { firstName, lastName } = parseDisplayName(item.name);

    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)} activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          <ProfileAvatar
            firstName={firstName}
            lastName={lastName}
            size={52}
          />
          <View style={styles.supportBadge}>
            <Headphones width={12} height={12} color={COLORS.textInverse} />
          </View>
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.timestamp ? <Text style={styles.timestamp}>{item.timestamp}</Text> : null}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || (isSuperAdmin ? 'Tap to view and respond' : 'Tap to message platform support')}
          </Text>
        </View>
        {item.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const headerVariant = isSuperAdmin ? 'superAdmin' : 'admin';
  const screenTitle = isSuperAdmin ? 'Admin Support Requests' : 'Platform Support';

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant={headerVariant}
        title={screenTitle}
        onMenuPress={openDrawer}
        onNotificationPress={onNotificationPress}
        notificationCount={notificationCount}
        profileDrawer={
          isSuperAdmin ? (
            <SuperAdminProfileDrawer visible={isDrawerVisible} onClose={closeDrawer} />
          ) : (
            <AdminProfileDrawer visible={isDrawerVisible} onClose={closeDrawer} />
          )
        }
      />

      {isAdmin && (
        <View style={styles.adminBanner}>
          <Text style={styles.adminBannerTitle}>Need help from tracSOpro?</Text>
          <Text style={styles.adminBannerText}>
            Message our platform team for billing, setup, or technical support.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAdminContactSupport}
            disabled={opening}
            activeOpacity={0.85}
          >
            <MessageCircle width={18} height={18} color={COLORS.textInverse} />
            <Text style={styles.primaryButtonText}>
              {opening ? 'Opening…' : chats.length > 0 ? 'Continue Support Chat' : 'Contact Support'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <InlineLoading message="Loading support chats…" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSupportChats} />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={chats.length === 0 ? styles.emptyList : styles.listContent}
          ListEmptyComponent={
            isSuperAdmin ? (
              <EmptyState
                title="No support requests yet"
                message="When company admins contact platform support, their conversations will appear here."
                icon={<Headphones width={40} height={40} color={COLORS.textTertiary} />}
              />
            ) : (
              <EmptyState
                title="No messages yet"
                message="Start a conversation with platform support using the button above."
                icon={<Headphones width={40} height={40} color={COLORS.textTertiary} />}
              />
            )
          }
        />
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  adminBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
  },
  adminBannerTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  adminBannerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  primaryButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  supportBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.backgroundPrimary,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  chatName: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  lastMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
  },
  unreadText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default SupportRequestsScreen;
