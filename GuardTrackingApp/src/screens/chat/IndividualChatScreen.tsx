import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation, useRoute } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { 
  ArrowLeft, 
  Mic, 
  Smile, 
  Send,
  MoreHorizontal 
} from 'react-native-feather';

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
}

const IndividualChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { chatId, chatName, avatar } = route.params as ChatScreenParams;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const apiService = (await import('../../services/api')).default;
      const response = await apiService.getChatMessages(chatId, 1, 50);
      
      if (!response.success || !response.data) {
        console.error('Failed to load messages:', response.message);
        setMessages([]);
        return;
      }
      
      // Transform API messages to match Message interface
      const transformedMessages: Message[] = response.data.map((msg: any) => ({
        id: msg.id,
        content: msg.content || msg.message,
        senderId: msg.senderId,
        timestamp: new Date(msg.timestamp),
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
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user) return;

    const messageText = inputText.trim();
    setInputText('');

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
      const response = await apiService.sendChatMessage(chatId, messageText, 'text');

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to send message');
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
              { color: item.isRead ? '#007AFF' : '#9CA3AF' }
            ]}>
              ✓
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaWrapper>
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
            <ArrowLeft width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>MO</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{chatName}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <MoreHorizontal width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Time Indicator */}
        <View style={styles.timeIndicatorContainer}>
          <View style={styles.timeIndicator}>
            <Text style={styles.timeIndicatorText}>4:58 PM</Text>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Say something..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              placeholderTextColor="#9CA3AF"
            />
            
            <View style={styles.inputActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleVoiceMessage}
              >
                <Mic width={20} height={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Smile width={20} height={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  inputText.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
              >
                <Send width={20} height={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
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
    marginLeft: 8,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeIndicatorText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  checkmark: {
    fontSize: 12,
    color: '#4A90E2',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingBottom: 16,
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
    backgroundColor: '#C7E3FF',
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#1F2937',
  },
  otherMessageText: {
    color: '#1F2937',
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
    color: '#9CA3AF',
  },
  readStatus: {
    fontSize: 12,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendButtonActive: {
    backgroundColor: '#4A90E2',
  },
  sendButtonInactive: {
    backgroundColor: '#9CA3AF',
  },
});

export default IndividualChatScreen;
