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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  newMessageButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newMessageButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  conversationsContainer: {
    width: 300,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  conversationItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  conversationPreview: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messageItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  messageItemOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  messageItemOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
  },
  messageItemEmergency: {
    backgroundColor: '#FF4444',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageTypeIcon: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 20,
    color: '#333',
  },
  messageContentOwn: {
    color: '#ffffff',
  },
  messageContentEmergency: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  attachmentsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  attachmentsText: {
    fontSize: 12,
    color: '#999',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  unreadIndicatorText: {
    color: '#FF4444',
    fontSize: 12,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noConversationSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConversationText: {
    fontSize: 16,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
  },
});

export default MessagesScreen;
