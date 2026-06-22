import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { 
  Mic, 
  Smile, 
  Send,
  MoreVertical,
  User,
  BellOff,
  Trash2,
  MessageCircle,
  X,
} from 'react-native-feather';
import { ChevronLeftIcon } from '../../components/ui/FeatherIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import WebSocketService from '../../services/WebSocketService';
import DropdownMenu, { DropdownMenuItem } from '../../components/ui/DropdownMenu';
import { EmptyState, InlineLoading } from '../../components/ui/LoadingStates';
import { parseDisplayName } from '../../utils/parseDisplayName';
import { parseDirectChatParticipants, resolveGuardEntityId, resolveChatParticipantProfile } from '../../utils/chatHelper';
import { pickProfilePictureUrl } from '../../utils/profilePictureUtils';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  isRead: boolean;
  isOwn: boolean;
}

interface ChatScreenParams {
  chatId: string;
  chatName: string;
  avatar?: string;
  guardId?: string;
  guardUserId?: string;
  clientUserId?: string;
  context?: 'report' | 'site' | 'general' | 'support';
}

const IndividualChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { chatId, chatName, avatar, guardId, guardUserId, clientUserId } =
    route.params as ChatScreenParams;

  const [headerName, setHeaderName] = useState(chatName);
  const [headerAvatar, setHeaderAvatar] = useState<string | undefined>(
    () => pickProfilePictureUrl({ avatar }) || avatar,
  );
  const { firstName, lastName } = parseDisplayName(headerName);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const flatListRef = useRef<FlatList>(null);
  const menuButtonRef = useRef<TouchableOpacity>(null);

  const handleViewProfile = async () => {
    setMenuVisible(false);
    const role = user?.role;
    const parsed = parseDirectChatParticipants(chatId, user?.id || '');

    if (role === 'CLIENT') {
      const targetGuardUserId = guardUserId || parsed.guardUserId;
      let entityId = guardId;
      if (!entityId && targetGuardUserId) {
        entityId = (await resolveGuardEntityId(targetGuardUserId)) || undefined;
      }
      if (entityId) {
        (navigation as any).navigate('ClientGuardDetails', {
          guardId: entityId,
          guardName: headerName,
          userId: targetGuardUserId,
          avatar: headerAvatar,
        });
        return;
      }
    }

    setProfileVisible(true);
  };

  // Build menu items for chat options
  const getChatMenuItems = (): DropdownMenuItem[] => {
    return [
      {
        id: 'view-profile',
        label: 'View Profile',
        icon: <User width={20} height={20} color={COLORS.primary} />,
        onPress: handleViewProfile,
      },
      {
        id: 'mute',
        label: 'Mute Notifications',
        icon: <BellOff width={20} height={20} color={COLORS.textSecondary} />,
        onPress: () => {
          Alert.alert('Muted', `Notifications muted for ${chatName}`);
        },
      },
      {
        id: 'delete',
        label: 'Delete Chat',
        icon: <Trash2 width={20} height={20} color={COLORS.error} />,
        destructive: true,
        onPress: () => {
          Alert.alert(
            'Delete Chat',
            `Delete this conversation with ${chatName}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => navigation.goBack(),
              },
            ],
          );
        },
      },
    ];
  };

  const handleMenuPress = () => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x: x + width, y: y + height });
      setMenuVisible(true);
    });
  };

  // Sync route params when navigating between chats
  useEffect(() => {
    setHeaderName(chatName);
    setHeaderAvatar(pickProfilePictureUrl({ avatar }) || avatar);
  }, [chatId, chatName, avatar]);

  // Load other participant profile (avatar) from chat API
  useEffect(() => {
    if (!chatId || !user?.id) return;

    resolveChatParticipantProfile(chatId, user.id).then((profile) => {
      if (!profile) return;
      if (profile.avatar) {
        setHeaderAvatar(profile.avatar);
      }
      if (profile.displayName) {
        setHeaderName(profile.displayName);
      }
    });
  }, [chatId, user?.id]);

  // Load messages when chatId changes
  useEffect(() => {
    loadMessages();
    
    // Join WebSocket room for real-time updates
    if (chatId) {
      WebSocketService.joinRoom(chatId);
    }
    
    return () => {
      // Leave room on unmount
      if (chatId) {
        WebSocketService.leaveRoom(chatId);
      }
    };
  }, [chatId]);

  // Set up WebSocket listeners for real-time messages
  useEffect(() => {
    // Listen for new messages via WebSocket
    const handleNewMessage = (data: any) => {
      if (data.chatId === chatId && data.message) {
        const newMessage: Message = {
          id: data.message.id,
          content: data.message.content || data.message.message,
          senderId: data.message.senderId,
          timestamp: new Date(data.message.timestamp || Date.now()),
          isRead: data.message.isRead || false,
          isOwn: data.message.senderId === user?.id,
        };
        
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        // Mark as read if it's not our message
        if (!newMessage.isOwn && user?.id) {
          const apiService = import('../../services/api').then(m => m.default);
          apiService.then(service => {
            service.markChatMessagesAsRead(chatId, [newMessage.id]);
          });
        }
      }
    };

    // Add WebSocket listener (you'll need to implement this in WebSocketService)
    // For now, we'll use the API polling method
    // WebSocketService.on('new_message', handleNewMessage);
    
    return () => {
      // Cleanup listener
      // WebSocketService.off('new_message', handleNewMessage);
    };
  }, [chatId, user]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const apiService = (await import('../../services/api')).default;
      const response = await apiService.getChatMessages(chatId, 1, 50);
      
      // Handle empty chat room gracefully - this is normal for new chats
      if (!response.success) {
        // If chat doesn't exist yet, that's okay - user can still send first message
        const errorMsg = response.message?.toLowerCase() || '';
        if (errorMsg.includes('not found') || 
            errorMsg.includes('404') ||
            errorMsg.includes('chat not found')) {
          if (__DEV__) {
            console.log('Chat room does not exist yet - will be created with first message');
          }
          setMessages([]);
          return;
        }
        
        // For other errors, log but allow user to continue
        console.error('Failed to load messages:', response.message);
        // Keep existing messages if available, otherwise set empty
        if (messages.length === 0) {
          setMessages([]);
        }
        return;
      }
      
      // Handle case where data might be undefined or null
      const messageData = response.data || [];
      
      // Handle empty messages array (new chat)
      if (!Array.isArray(messageData)) {
        console.warn('Messages data is not an array:', messageData);
        setMessages([]);
        return;
      }
      
      if (messageData.length === 0) {
        setMessages([]);
        return;
      }
      
      // Transform API messages to match Message interface
      const transformedMessages: Message[] = messageData.map((msg: any) => ({
        id: msg.id,
        content: msg.content || msg.message,
        senderId: msg.senderId,
        timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()),
        isRead: msg.isRead || msg.readBy?.includes(user?.id) || false,
        isOwn: msg.senderId === user?.id,
      }));
      
      setMessages(transformedMessages);
      
      // Mark messages as read when viewing
      if (transformedMessages.length > 0 && user?.id) {
        const unreadMessageIds = transformedMessages
          .filter(msg => !msg.isRead && !msg.isOwn)
          .map(msg => msg.id);
        
        if (unreadMessageIds.length > 0) {
          await apiService.markChatMessagesAsRead(chatId, unreadMessageIds);
        }
      }
    } catch (error: any) {
      // Handle errors gracefully - allow user to still send messages
      console.error('Error loading messages:', error);
      
      // Don't show error alert for 404 (chat doesn't exist yet)
      const isNotFound = error?.response?.status === 404 || 
                        error?.message?.toLowerCase().includes('not found');
      
      if (isNotFound) {
        if (__DEV__) {
          console.log('Chat may not exist yet - first message will create it');
        }
        setMessages([]);
      } else {
        // For other errors, keep existing messages if available
        if (messages.length === 0) {
          setMessages([]);
        }
        if (__DEV__) {
          console.error('Message loading error details:', {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistically add message to UI
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content: messageText,
      senderId: user.id,
      timestamp: new Date(),
      isRead: false,
      isOwn: true,
    };

    setMessages(prev => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send message to backend via API service
      const apiService = (await import('../../services/api')).default;
      let response = await apiService.sendChatMessage(chatId, messageText, 'text');

      // If chat doesn't exist, try to create it first
      if (!response.success && (response.message?.toLowerCase().includes('not found') || 
          response.message?.toLowerCase().includes('404') ||
          response.message?.toLowerCase().includes('chat'))) {
        console.log('Chat room may not exist, but message should still work - trying to send again');
        // The backend should handle creating the conversation automatically via conversationId
        // Just log and continue - the message will create the conversation
      }
      
      if (!response.success || !response.data) {
        // Remove temp message on failure
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        Alert.alert('Error', response.message || 'Failed to send message. Please try again.');
        return;
      }

      const sentMessage = response.data;

      // Replace temp message with actual message from server
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? {
              id: sentMessage.id,
              content: sentMessage.content || sentMessage.message,
              senderId: sentMessage.senderId,
              timestamp: new Date(sentMessage.timestamp),
              isRead: sentMessage.isRead || sentMessage.readBy?.includes(user.id) || false,
              isOwn: true,
            }
          : msg
      ));
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVoiceMessage = () => {
    Alert.alert('Voice Message', 'Voice message feature coming soon!');
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isConsecutive = index > 0 && 
      messages[index - 1].isOwn === item.isOwn && 
      (item.timestamp.getTime() - messages[index - 1].timestamp.getTime()) < 60000; // Within 1 minute

    return (
      <View style={[
        styles.messageContainer,
        item.isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        isConsecutive && styles.consecutiveMessage,
      ]}>
        <View style={[
          styles.messageBubble,
          item.isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
        ]}>
          <Text style={[
            styles.messageText,
            item.isOwn ? styles.ownMessageText : styles.otherMessageText,
          ]}>
            {item.content}
          </Text>
        </View>
        
        <View style={[
          styles.messageFooter,
          item.isOwn ? styles.ownMessageFooter : styles.otherMessageFooter,
        ]}>
          <Text style={styles.messageTime}>
            {formatTime(item.timestamp)}
          </Text>
          {item.isOwn && (
            <Text style={[
              styles.readStatus,
              { color: item.isRead ? COLORS.primary : COLORS.textTertiary }
            ]}>
              ✓
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaWrapper includeTop>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeftIcon size={24} color={COLORS.textInverse} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <ProfileAvatar
              firstName={firstName}
              lastName={lastName}
              profilePictureUrl={headerAvatar}
              avatar={headerAvatar}
              size={40}
              backgroundColor="rgba(255,255,255,0.2)"
              textColor={COLORS.textInverse}
            />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>{headerName}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            ref={menuButtonRef}
            style={styles.moreButton}
            onPress={handleMenuPress}
          >
            <MoreVertical width={24} height={24} color={COLORS.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        <DropdownMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          items={getChatMenuItems()}
          anchorPosition={menuAnchor}
          alignment="right"
        />

        {loading && messages.length === 0 && (
          <InlineLoading message="Loading messages..." style={styles.loadingContainer} />
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={
            messages.length === 0
              ? [styles.messagesContent, { flexGrow: 1, justifyContent: 'center' }]
              : styles.messagesContent
          }
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListEmptyComponent={
            loading ? null : (
              <EmptyState
                title="No messages yet"
                message="Say hello to start the conversation."
                icon={<MessageCircle width={40} height={40} color={COLORS.textTertiary} />}
              />
            )
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              placeholderTextColor={COLORS.textTertiary}
            />
            
            <View style={styles.inputActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleVoiceMessage}
              >
                <Mic width={20} height={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Smile width={20} height={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  inputText.trim() && !sending ? styles.sendButtonActive : styles.sendButtonInactive
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.textInverse} />
                ) : (
                  <Send width={20} height={20} color={COLORS.textInverse} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={profileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileVisible(false)}
      >
        <Pressable style={styles.profileOverlay} onPress={() => setProfileVisible(false)}>
          <Pressable style={styles.profileSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.profileSheetHeader}>
              <Text style={styles.profileSheetTitle}>Contact</Text>
              <TouchableOpacity onPress={() => setProfileVisible(false)} hitSlop={12}>
                <X width={22} height={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileSheetBody}>
              <ProfileAvatar
                firstName={firstName}
                lastName={lastName}
                profilePictureUrl={headerAvatar}
                avatar={headerAvatar}
                size={72}
              />
              <Text style={styles.profileSheetName}>{headerName}</Text>
              <Text style={styles.profileSheetRole}>
                {user?.role === 'GUARD'
                  ? 'Client'
                  : user?.role === 'ADMIN'
                    ? 'Team member'
                    : 'Contact'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileCloseButton}
              onPress={() => setProfileVisible(false)}
            >
              <Text style={styles.profileCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    gap: SPACING.sm,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  loadingContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textTertiary,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  timeIndicatorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  checkmark: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  messagesContent: {
    paddingBottom: SPACING.lg,
  },
  messageContainer: {
    marginVertical: 2,
  },
  consecutiveMessage: {
    marginTop: 2,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.backgroundTertiary,
    borderBottomRightRadius: BORDER_RADIUS.xs,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomLeftRadius: BORDER_RADIUS.xs,
    ...SHADOWS.small,
  },
  messageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 22,
  },
  ownMessageText: {
    color: COLORS.textPrimary,
  },
  otherMessageText: {
    color: COLORS.textPrimary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  ownMessageFooter: {
    justifyContent: 'flex-end',
  },
  otherMessageFooter: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  readStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.xs,
  },
  inputContainer: {
    backgroundColor: COLORS.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    maxHeight: 100,
    paddingVertical: SPACING.sm,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sendButtonInactive: {
    backgroundColor: COLORS.textTertiary,
  },
  profileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  profileSheet: {
    backgroundColor: COLORS.backgroundPrimary,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxxl,
  },
  profileSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  profileSheetTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  profileSheetBody: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  profileSheetName: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  profileSheetRole: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  profileCloseButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  profileCloseButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
});

export default IndividualChatScreen;
