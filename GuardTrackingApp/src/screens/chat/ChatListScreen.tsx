import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { Search, Bell, Menu } from 'react-native-feather';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar?: string;
  unreadCount: number;
  isOnline?: boolean;
}

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const apiService = (await import('../../services/api')).default;
      const response = await apiService.getChatRooms();
      
      if (!response.success || !response.data) {
        console.error('Failed to load chats:', response.message);
        setChats([]);
        return;
      }

      // Transform backend chat data to ChatItem format
      const transformedChats: ChatItem[] = (response.data || []).map((chat: any) => {
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

        return {
          id: chat.id,
          name: chatName,
          lastMessage: chat.lastMessage?.content || chat.lastMessage?.message || '',
          timestamp,
          avatar,
          unreadCount: chat.unreadCount || 0,
          isOnline,
        };
      });

      // Sort by last message time (most recent first)
      transformedChats.sort((a, b) => {
        const timeA = a.timestamp === 'now' ? 0 : a.timestamp.includes('m') ? 1 : a.timestamp.includes('h') ? 2 : 3;
        const timeB = b.timestamp === 'now' ? 0 : b.timestamp.includes('m') ? 1 : b.timestamp.includes('h') ? 2 : 3;
        return timeA - timeB;
      });

      setChats(transformedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: ChatItem) => {
    (navigation as any).navigate('IndividualChatScreen', { 
      chatId: chat.id, 
      chatName: chat.name,
      avatar: chat.avatar 
    });
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={item.avatar ? { uri: item.avatar } : { uri: 'https://via.placeholder.com/150x150/E5E7EB/9CA3AF?text=?' }}
          style={styles.avatar}
        />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.timestamp}>
            {item.timestamp}
          </Text>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
          style={styles.notificationButton}
          onPress={() => {
            // Navigate to create new chat or show options
            // For now, just show placeholder
          }}
        >
          <Text style={styles.newChatButton}>+</Text>
        </TouchableOpacity>
      </View>

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
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  newChatButton: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default ChatListScreen;
