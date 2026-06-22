import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { pickProfilePictureUrl } from '../../utils/profilePictureUtils';
import { Search, MoreVertical, MessageCircle, Settings, Users } from 'react-native-feather';
import { ChevronLeftIcon } from '../../components/ui/FeatherIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import NewChatModal from '../../components/chat/NewChatModal';
import FormInput from '../../components/common/FormInput';
import DropdownMenu, { DropdownMenuItem } from '../../components/ui/DropdownMenu';
import { EmptyState, ErrorState, InlineLoading, NetworkError } from '../../components/ui/LoadingStates';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { parseDisplayName } from '../../utils/parseDisplayName';
import { navigateToSupportHub, roleToSupportVariant } from '../../utils/tabNavigationHelpers';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar?: string;
  unreadCount: number;
  isOnline?: boolean;
  isAssignedGuard?: boolean; // Flag for guards assigned to client's sites
}

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [rawChats, setRawChats] = useState<any[]>([]); // Store raw chat data for creating new chats
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef<any>(null);

  // Build menu items based on user role
  const getMenuItems = (): DropdownMenuItem[] => {
    const baseItems: DropdownMenuItem[] = [
      {
        id: 'new-chat',
        label: 'New Chat',
        icon: <MessageCircle width={20} height={20} color={COLORS.primary} />,
        onPress: () => setNewChatModalVisible(true),
      },
    ];

    // Admin / Super Admin: separate platform support from team chats
    const supportVariant = roleToSupportVariant(user?.role);
    if (supportVariant) {
      const isStaff = supportVariant === 'admin' || supportVariant === 'superAdmin';
      baseItems.unshift({
        id: isStaff ? 'support-requests' : 'support-center',
        label:
          supportVariant === 'superAdmin'
            ? 'Platform Support Inbox'
            : supportVariant === 'admin'
              ? 'Support Center'
              : 'Support Center',
        icon: <MessageCircle width={20} height={20} color={COLORS.primary} />,
        onPress: () => navigateToSupportHub(navigation as any, supportVariant),
      });
    }

    // Admin can create group chats
    if (user?.role === 'ADMIN' || (user?.role as string) === 'SUPER_ADMIN') {
      baseItems.push({
        id: 'new-group',
        label: 'New Group Chat',
        icon: <Users width={20} height={20} color={COLORS.primary} />,
        onPress: () => {
          // TODO: Implement group chat creation
          Alert.alert('Coming Soon', 'Group chat feature will be available soon!');
        },
      });
    }

    baseItems.push({
      id: 'settings',
      label: 'Chat Settings',
      icon: <Settings width={20} height={20} color={COLORS.textSecondary} />,
      onPress: () => {
        // TODO: Navigate to chat settings
        Alert.alert('Chat Settings', 'Notification and privacy settings for chats');
      },
    });

    return baseItems;
  };

  const handleMenuPress = () => {
    // Measure the menu button position
    menuButtonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuAnchor({ x: x + width, y: y + height });
      setMenuVisible(true);
    });
  };

  useEffect(() => {
    loadChats();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, []),
  );

  const buildChatNavParams = (chat: ChatItem) => {
    const rawChat = rawChats.find((c: any) => c.id === chat.id);
    const metadata = rawChat?.metadata;
    const otherParticipant = rawChat?.participants?.find(
      (p: any) => p.userId !== user?.id,
    );

    return {
      chatId: chat.id,
      chatName: chat.name.split(' (')[0],
      avatar: chat.avatar,
      guardId: metadata?.guardId as string | undefined,
      guardUserId:
        otherParticipant?.user?.role === 'GUARD' ? otherParticipant.userId : undefined,
      clientUserId:
        otherParticipant?.user?.role === 'CLIENT' ? otherParticipant.userId : undefined,
    };
  };

  const loadChats = async () => {
    try {
      setError(null);
      const apiService = (await import('../../services/api')).default;
      const response = await apiService.getChatRooms();

      if (!response.success) {
        const message = response.message || 'Failed to load chats';
        console.error('Failed to load chats:', message);
        setError(message);
        if (chats.length === 0) {
          setChats([]);
        }
        return;
      }

      // Handle case where data might be undefined or null
      const chatData = response.data || [];
      if (!Array.isArray(chatData)) {
        console.warn('Chat data is not an array:', chatData);
        setChats([]);
        return;
      }

      // Transform backend chat data to ChatItem format
      const transformedChats: ChatItem[] = chatData.map((chat: any) => {
        // Get other participant's info for direct chats
        let chatName = chat.name || 'Chat';
        let avatar: string | undefined;
        let isOnline = false;

        if (chat.type === 'direct' && chat.participants) {
          const otherParticipant = chat.participants.find((p: any) =>
            p.userId !== user?.id && p.user
          );
          if (otherParticipant?.user) {
            chatName = `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`.trim();
            avatar = pickProfilePictureUrl(otherParticipant.user) || chat.avatar;
            isOnline = otherParticipant.user.isOnline || false;
          }
        }

        // Handle assigned guards (guards assigned to client's sites)
        const isAssignedGuard = (chat as any).metadata?.isAssignedGuard;
        if (isAssignedGuard && chat.participants) {
          const guardParticipant = chat.participants.find((p: any) =>
            p.userId !== user?.id && p.user?.role === 'GUARD'
          );
          if (guardParticipant?.user) {
            chatName = `${guardParticipant.user.firstName} ${guardParticipant.user.lastName}`.trim();
            avatar = pickProfilePictureUrl(guardParticipant.user) || chat.avatar;
            // Show site name if available
            const siteName = (chat as any).metadata?.siteName;
            if (siteName && !chat.lastMessage) {
              // For assigned guards without messages, show site info
              chatName = `${chatName} (${siteName})`;
            }
          }
        }

        // Format timestamp
        const lastMsgTime = chat.lastMessageAt
          ? new Date(chat.lastMessageAt)
          : chat.lastMessage?.timestamp
            ? new Date(chat.lastMessage.timestamp)
            : null;
        const timestamp = lastMsgTime ? formatRelativeTime(lastMsgTime) : '';
        const lastMessage = chat.lastMessage?.content || chat.lastMessage?.message || '';

        // For assigned guards without messages, show a helpful placeholder
        const displayMessage = isAssignedGuard && !lastMessage
          ? 'Tap to start conversation'
          : lastMessage;

        return {
          id: chat.id,
          name: chatName,
          lastMessage: displayMessage,
          timestamp: isAssignedGuard && !lastMessage ? '' : timestamp,
          avatar,
          unreadCount: chat.unreadCount || 0,
          isOnline,
          isAssignedGuard, // Add flag for UI styling
        };
      });

      // Sort by last message time (most recent first)
      transformedChats.sort((a, b) => {
        const timeA = a.timestamp === 'now' ? 0 : a.timestamp.includes('m') ? 1 : a.timestamp.includes('h') ? 2 : 3;
        const timeB = b.timestamp === 'now' ? 0 : b.timestamp.includes('m') ? 1 : b.timestamp.includes('h') ? 2 : 3;
        return timeA - timeB;
      });

      // Deduplicate chats by name (to prevent the same person appearing multiple times)
      // Since we sorted first, we keep the most recent chat
      const seenNames = new Set<string>();
      const uniqueChats = transformedChats.filter(chat => {
        const normalizedName = chat.name.toLowerCase().trim().split(' (')[0]; // Remove site info for comparison
        if (seenNames.has(normalizedName)) {
          return false;
        }
        seenNames.add(normalizedName);
        return true;
      });

      setChats(uniqueChats);
      setRawChats(chatData);
    } catch (error: any) {
      console.error('Error loading chats:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load chats';
      setError(message);
      if (chats.length === 0) {
        setChats([]);
      }
      if (__DEV__) {
        console.error('Chat loading error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = async (chat: ChatItem) => {
    // If this is an assigned guard without a chat, create the chat first
    if (chat.isAssignedGuard && !chat.lastMessage) {
      try {
        const apiService = (await import('../../services/api')).default;
        // Find the raw chat data to get participants
        const rawChatData = rawChats.find((c: any) => c.id === chat.id);
        const guardParticipant = rawChatData?.participants?.find((p: any) =>
          p.userId !== user?.id && p.user?.role === 'GUARD'
        );

        if (guardParticipant?.userId) {
          // Create a direct chat with the guard
          const createResponse = await apiService.createChat('direct', [guardParticipant.userId]);

          if (createResponse.success && createResponse.data) {
            // Reload chats to get the updated list
            await loadChats();
            // Navigate to the newly created chat
            (navigation as any).navigate('IndividualChatScreen', buildChatNavParams(chat));
            return;
          }
        }
      } catch (error) {
        console.error('Error creating chat with guard:', error);
        // Fall through to navigate with existing chat ID
      }
    }

    // Navigate to existing chat
    (navigation as any).navigate('IndividualChatScreen', buildChatNavParams(chat));
  };

  const filteredChats = chats.filter(chat => {
    if (!chat || !chat.name) return false;
    const query = searchQuery.toLowerCase();
    const nameMatch = chat.name.toLowerCase().includes(query);
    const messageMatch = chat.lastMessage ? chat.lastMessage.toLowerCase().includes(query) : false;
    return nameMatch || messageMatch;
  });

  const renderChatItem = ({ item, index }: { item: ChatItem; index: number }) => {
    if (!item || !item.id) {
      return null;
    }

    const { firstName, lastName } = parseDisplayName(item.name);

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          item.isAssignedGuard && !item.lastMessage && styles.assignedGuardItem
        ]}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <ProfileAvatar
            firstName={firstName}
            lastName={lastName}
            profilePictureUrl={item.avatar}
            size={52}
          />
          {item.isOnline && <View style={styles.onlineIndicator} />}
          {item.isAssignedGuard && (
            <View style={styles.assignedBadge}>
              <Text style={styles.assignedBadgeText}>Site</Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {item.name || 'Chat'}
            </Text>
            {item.timestamp ? (
              <Text style={styles.timestamp}>
                {item.timestamp}
              </Text>
            ) : null}
          </View>

          <Text
            style={[
              styles.lastMessage,
              item.isAssignedGuard && !item.lastMessage && styles.assignedGuardMessage
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || ''}
          </Text>
        </View>

        {item.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const isSuperAdmin = (user?.role as string) === 'SUPER_ADMIN';
  const canGoBack = navigation.canGoBack();

  const chatActionsButton = (
    <TouchableOpacity
      ref={menuButtonRef}
      style={styles.headerSideButton}
      onPress={handleMenuPress}
    >
      <MoreVertical width={24} height={24} color={COLORS.textPrimary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaWrapper>
      {isSuperAdmin ? (
        <SharedHeader
          variant="superAdmin"
          title="Chats"
          showBackButton={canGoBack}
          onBackPress={() => navigation.goBack()}
          hideLeftAction={!canGoBack}
          rightIcon={chatActionsButton}
        />
      ) : (
        <View style={styles.header}>
          {canGoBack ? (
            <TouchableOpacity
              style={styles.headerSideButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeftIcon size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSideButton} />
          )}
          <Text style={styles.headerTitle}>Chats</Text>
          {chatActionsButton}
        </View>
      )}

      {/* Dropdown Menu */}
      <DropdownMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={getMenuItems()}
        anchorPosition={menuAnchor}
        alignment="right"
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FormInput
          icon="search"
          placeholder="Search chats..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Chat List */}
      {loading && chats.length === 0 && !refreshing ? (
        <InlineLoading size="large" message="Loading chats..." style={styles.centeredState} />
      ) : error && chats.length === 0 ? (
        <View style={styles.centeredState}>
          {error.toLowerCase().includes('network') ||
          error.toLowerCase().includes('connection') ? (
            <NetworkError onRetry={loadChats} />
          ) : (
            <ErrorState error={error} onRetry={loadChats} />
          )}
        </View>
      ) : (
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item, index) => item.id || `chat-${index}`}
        style={styles.chatList}
        contentContainerStyle={
          filteredChats.length === 0
            ? [styles.chatListContent, { flexGrow: 1, justifyContent: 'center' }]
            : styles.chatListContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          searchQuery ? (
            <EmptyState
              title="No matches"
              message="Try a different name or message keyword."
              icon={<Search width={40} height={40} color={COLORS.textTertiary} />}
            />
          ) : (
            <EmptyState
              title="No chats yet"
              message="Start a conversation with a guard, client, or team member."
              actionText="New chat"
              onAction={() => setNewChatModalVisible(true)}
              icon={<MessageCircle width={40} height={40} color={COLORS.textTertiary} />}
            />
          )
        }
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setNewChatModalVisible(true)}
        activeOpacity={0.8}
      >
        <MessageCircle width={24} height={24} color={COLORS.textInverse} />
      </TouchableOpacity>

      {/* New Chat Modal */}
      <NewChatModal
        visible={newChatModalVisible}
        onClose={() => setNewChatModalVisible(false)}
        onSelectUser={async (userId, userName, userRole) => {
          try {
            if (!user) {
              Alert.alert('Error', 'User not logged in');
              return;
            }

            const apiService = (await import('../../services/api')).default;

            // Create chat with selected user
            const createResponse = await apiService.createChat('direct', [userId]);

            if (createResponse.success && createResponse.data) {
              // Reload chats to get the new one
              await loadChats();

              // Navigate to the new chat
              (navigation as any).navigate('IndividualChatScreen', {
                chatId: createResponse.data.id,
                chatName: userName,
              });
            } else {
              Alert.alert('Error', createResponse.message || 'Failed to create chat');
            }
          } catch (error: any) {
            console.error('Error creating chat:', error);
            Alert.alert('Error', error.message || 'Failed to create chat. Please try again.');
          }
        }}
        currentUserRole={user?.role}
      />
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
  },
  headerSideButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    height: '100%',
  },
  chatList: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  chatListContent: {
    paddingBottom: SPACING.xxxxl * 2.5, // Space for bottom tab bar
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundSecondary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
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
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
    marginLeft: SPACING.sm,
  },
  lastMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs + 2,
    marginLeft: SPACING.md,
  },
  unreadCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.backgroundSecondary,
    marginLeft: 84, // Align with chat content
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  assignedGuardItem: {
    backgroundColor: COLORS.backgroundSecondary,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  assignedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignedBadgeText: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  assignedGuardMessage: {
    fontStyle: 'italic',
    color: COLORS.primary,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xxxxl * 2,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    elevation: 5,
    zIndex: 10,
  },
});

export default ChatListScreen;
