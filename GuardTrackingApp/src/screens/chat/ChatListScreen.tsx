import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { Search, Bell, Menu, MoreVertical, MessageCircle, Users, Settings } from 'react-native-feather';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import NewChatModal from '../../components/chat/NewChatModal';
import DropdownMenu, { DropdownMenuItem } from '../../components/ui/DropdownMenu';

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
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [rawChats, setRawChats] = useState<any[]>([]); // Store raw chat data for creating new chats
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef<TouchableOpacity>(null);

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

    // Admin can create group chats
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
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
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x: x + width, y: y + height });
      setMenuVisible(true);
    });
  };

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const apiService = (await import('../../services/api')).default;
      const response = await apiService.getChatRooms();
      
      if (!response.success) {
        console.error('Failed to load chats:', response.message || 'Unknown error');
        // Don't set empty array on error - keep previous chats if available
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
            avatar = otherParticipant.user.avatar;
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
            avatar = guardParticipant.user.avatar;
            // Show site name if available
            const siteName = (chat as any).metadata?.siteName;
            if (siteName && !chat.lastMessage) {
              // For assigned guards without messages, show site info
              chatName = `${chatName} (${siteName})`;
            }
          }
        }

        // Format timestamp
        let timestamp = 'now';
        if (chat.lastMessageAt || chat.lastMessage?.timestamp) {
          const lastMsgTime = chat.lastMessageAt 
            ? new Date(chat.lastMessageAt) 
            : new Date(chat.lastMessage.timestamp);
          const now = new Date();
          const diffMs = now.getTime() - lastMsgTime.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          if (diffMins < 1) {
            timestamp = 'now';
          } else if (diffMins < 60) {
            timestamp = `${diffMins}m`;
          } else if (diffHours < 24) {
            timestamp = `${diffHours}h`;
          } else if (diffDays === 1) {
            timestamp = 'Yest';
          } else {
            timestamp = lastMsgTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        }
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
      setRawChats(chatData); // Store raw chat data
    } catch (error: any) {
      console.error('Error loading chats:', error);
      // Only clear chats if we don't have any cached ones
      // This prevents flickering when network temporarily fails
      if (chats.length === 0) {
        setChats([]);
      }
      // Log detailed error for debugging
      if (__DEV__) {
        console.error('Chat loading error details:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });
      }
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
            (navigation as any).navigate('IndividualChatScreen', {
              chatId: createResponse.data.id || chat.id,
              chatName: chat.name,
              avatar: chat.avatar
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error creating chat with guard:', error);
        // Fall through to navigate with existing chat ID
      }
    }
    
    // Navigate to existing chat
    (navigation as any).navigate('IndividualChatScreen', { 
      chatId: chat.id, 
      chatName: chat.name,
      avatar: chat.avatar 
    });
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
          <Image
            source={item.avatar ? { uri: item.avatar } : { uri: 'https://via.placeholder.com/150x150/E5E7EB/9CA3AF?text=?' }}
            style={styles.avatar}
            defaultSource={{ uri: 'https://via.placeholder.com/150x150/E5E7EB/9CA3AF?text=?' }}
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

  return (
    <SafeAreaWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => (navigation as any).goBack()}
        >
          <Menu width={24} height={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Chats</Text>
        
        <TouchableOpacity 
          ref={menuButtonRef}
          style={styles.notificationButton}
          onPress={handleMenuPress}
        >
          <MoreVertical width={24} height={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

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
        <View style={styles.searchInputContainer}>
          <Search width={20} height={20} color={COLORS.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="search"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
      </View>

      {/* Chat List */}
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
        ItemSeparatorComponent={filteredChats.length > 0 ? () => <View style={styles.separator} /> : null}
        ListEmptyComponent={
          refreshing ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading chats...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'No chats match your search' : 'Start a conversation to see chats here'}
              </Text>
            </View>
          )
        }
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundPrimary,
  },
  menuButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  notificationButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ChatListScreen;
