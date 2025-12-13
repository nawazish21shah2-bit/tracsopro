// Messages Screen Component
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import { fetchMessages, sendMessage, markMessageAsRead } from '../../store/slices/messageSlice';
import { Message, MessageType } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

type MessagesScreenNavigationProp = StackNavigationProp<any, 'Messages'>;

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<MessagesScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { messages, conversations, isLoading } = useSelector((state: RootState) => state.messages);
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      await dispatch(fetchMessages());
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    if (!selectedConversation) {
      Alert.alert('Error', 'Please select a conversation');
      return;
    }

    try {
      const result = await dispatch(sendMessage({
        recipientId: selectedConversation,
        content: newMessage.trim(),
        type: MessageType.TEXT,
      }));

      if (sendMessage.fulfilled.match(result)) {
        setNewMessage('');
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleMessagePress = (message: Message) => {
    if (!message.isRead && message.recipientId === user?.id) {
      dispatch(markMessageAsRead(message.id));
    }
  };

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case MessageType.TEXT: return '💬';
      case MessageType.IMAGE: return '🖼️';
      case MessageType.VIDEO: return '🎥';
      case MessageType.AUDIO: return '🎵';
      case MessageType.LOCATION: return '📍';
      case MessageType.EMERGENCY: return '🚨';
      default: return '💬';
    }
  };

  const getConversationTitle = (conversationId: string) => {
    // In a real app, you'd fetch the other participant's name
    return `User ${conversationId.slice(-4)}`;
  };

  const getConversationPreview = (conversationId: string) => {
    const conversationMessages = messages.filter(
      msg => msg.senderId === conversationId || msg.recipientId === conversationId
    );
    
    if (conversationMessages.length === 0) return 'No messages';
    
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    return lastMessage.content;
  };

  const getUnreadCount = (conversationId: string) => {
    return messages.filter(
      msg => msg.recipientId === user?.id && 
             (msg.senderId === conversationId || msg.recipientId === conversationId) &&
             !msg.isRead
    ).length;
  };

  const renderConversationItem = ({ item }: { item: any }) => {
    const unreadCount = getUnreadCount(item.id);
    const isSelected = selectedConversation === item.id;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, isSelected && styles.conversationItemSelected]}
        onPress={() => setSelectedConversation(item.id)}
      >
        <View style={styles.conversationAvatar}>
          <Text style={styles.avatarText}>
            {getConversationTitle(item.id).charAt(0)}
          </Text>
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationTitle}>
              {getConversationTitle(item.id)}
            </Text>
            <Text style={styles.conversationTime}>
              {new Date(item.lastMessage.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          
          <Text style={styles.conversationPreview} numberOfLines={1}>
            {getConversationPreview(item.id)}
          </Text>
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    const isEmergency = item.type === MessageType.EMERGENCY;

    return (
      <TouchableOpacity
        style={[
          styles.messageItem,
          isOwnMessage ? styles.messageItemOwn : styles.messageItemOther,
          isEmergency && styles.messageItemEmergency
        ]}
        onPress={() => handleMessagePress(item)}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.messageTypeIcon}>
            {getMessageTypeIcon(item.type)}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        <Text style={[
          styles.messageContent,
          isOwnMessage && styles.messageContentOwn,
          isEmergency && styles.messageContentEmergency
        ]}>
          {item.content}
        </Text>

        {item.attachments && item.attachments.length > 0 && (
          <View style={styles.attachmentsContainer}>
            <Text style={styles.attachmentsText}>
              📎 {item.attachments.length} attachment{item.attachments.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {!item.isRead && !isOwnMessage && (
          <View style={styles.unreadIndicator}>
            <Text style={styles.unreadIndicatorText}>●</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newMessageButton}>
          <Text style={styles.newMessageButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Conversations List */}
        <View style={styles.conversationsContainer}>
          <Text style={styles.sectionTitle}>Conversations</Text>
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            style={styles.conversationsList}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Messages List */}
        <View style={styles.messagesContainer}>
          {selectedConversation ? (
            <>
              <View style={styles.messagesHeader}>
                <Text style={styles.messagesTitle}>
                  {getConversationTitle(selectedConversation)}
                </Text>
              </View>
              
              <FlatList
                data={messages.filter(
                  msg => msg.senderId === selectedConversation || msg.recipientId === selectedConversation
                )}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No messages yet</Text>
                    <Text style={styles.emptyStateSubtext}>Start a conversation</Text>
                  </View>
                }
              />

              {/* Message Input */}
              <View style={styles.messageInputContainer}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#999"
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.noConversationSelected}>
              <Text style={styles.noConversationText}>Select a conversation to start messaging</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  newMessageButton: {
    backgroundColor: COLORS.backgroundPrimary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.small,
  },
  newMessageButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  conversationsContainer: {
    width: 300,
    backgroundColor: COLORS.backgroundPrimary,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  conversationItemSelected: {
    backgroundColor: COLORS.backgroundTertiary,
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  conversationTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  conversationPreview: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  unreadBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  unreadBadgeText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  messagesHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  messagesTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  messageItem: {
    marginVertical: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    maxWidth: '80%',
  },
  messageItemOwn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  messageItemOther: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
  },
  messageItemEmergency: {
    backgroundColor: COLORS.error,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageTypeIcon: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  messageTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  messageContent: {
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
    color: COLORS.textPrimary,
  },
  messageContentOwn: {
    color: COLORS.textInverse,
  },
  messageContentEmergency: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  attachmentsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  attachmentsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textTertiary,
  },
  unreadIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  unreadIndicatorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    maxHeight: 100,
    marginRight: SPACING.md,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    ...SHADOWS.small,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  sendButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  noConversationSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConversationText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxxl,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
  },
});

export default MessagesScreen;
