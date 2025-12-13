/**
 * Real-time Chat Screen
 * Guard-to-Admin messaging with file sharing and typing indicators
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { 
  setActiveRoom, 
  messageSent, 
  fetchMessages,
  cleanupTypingIndicators 
} from '../../store/slices/chatSlice';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import WebSocketService from '../../services/WebSocketService';
import cameraService from '../../services/cameraService';
import locationTrackingService from '../../services/locationTrackingService';
import { ErrorHandler } from '../../utils/errorHandler';

interface ChatScreenProps {
  navigation: any;
  route: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { roomId, roomName = 'Chat' } = route.params || {};
  
  const { messages, typingUsers, isConnected } = useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const roomMessages = messages[roomId] || [];
  const roomTypingUsers = typingUsers[roomId] || [];

  useEffect(() => {
    if (roomId) {
      dispatch(setActiveRoom(roomId));
      dispatch(fetchMessages(roomId) as any);
      WebSocketService.joinRoom(roomId);
    }

    return () => {
      dispatch(setActiveRoom(null));
      if (roomId) {
        WebSocketService.leaveRoom(roomId);
      }
    };
  }, [roomId, dispatch]);

  // Cleanup typing indicators periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(cleanupTypingIndicators());
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (roomMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [roomMessages.length]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !roomId || !user) return;

    const message = {
      senderId: user.id,
      senderName: user.name || 'Guard',
      senderRole: user.role || 'GUARD',
      roomId,
      message: messageText.trim(),
      messageType: 'text' as const,
    };

    try {
      // Send via WebSocket
      WebSocketService.sendMessage(message);
      
      // Add to local state immediately for better UX
      dispatch(messageSent({
        ...message,
        id: `temp_${Date.now()}`,
        timestamp: Date.now(),
        readBy: [user.id],
      }));

      setMessageText('');
      handleTypingStop();
    } catch (error) {
      ErrorHandler.handleError(error, 'send_message');
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [messageText, roomId, user, dispatch]);

  const handleTypingStart = useCallback(() => {
    if (!isTyping && roomId) {
      setIsTyping(true);
      WebSocketService.sendTypingIndicator(roomId, true);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 3000);
  }, [isTyping, roomId]);

  const handleTypingStop = useCallback(() => {
    if (isTyping && roomId) {
      setIsTyping(false);
      WebSocketService.sendTypingIndicator(roomId, false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isTyping, roomId]);

  const handleSendImage = async () => {
    try {
      const photo = await cameraService.showPhotoOptions('incident', undefined, undefined);
      if (photo && roomId && user) {
        // In a real app, you'd upload the image first and get a URL
        const imageMessage = {
          senderId: user.id,
          senderName: user.name || 'Guard',
          senderRole: user.role || 'GUARD',
          roomId,
          message: photo.fileName,
          messageType: 'image' as const,
          fileUrl: photo.uri,
          fileName: photo.fileName,
          fileSize: photo.fileSize,
        };

        WebSocketService.sendMessage(imageMessage);
        
        dispatch(messageSent({
          ...imageMessage,
          id: `temp_${Date.now()}`,
          timestamp: Date.now(),
          readBy: [user.id],
        }));
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'send_image');
      Alert.alert('Error', 'Failed to send image. Please try again.');
    }
  };

  const handleSendLocation = async () => {
    try {
      const location = locationTrackingService.getLastKnownLocation();
      if (!location) {
        Alert.alert('Location Error', 'Unable to get current location.');
        return;
      }

      if (roomId && user) {
        const locationMessage = {
          senderId: user.id,
          senderName: user.name || 'Guard',
          senderRole: user.role || 'GUARD',
          roomId,
          message: `Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
          messageType: 'location' as const,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            guardId: user.id,
            timestamp: Date.now(),
          },
        };

        WebSocketService.sendMessage(locationMessage);
        
        dispatch(messageSent({
          ...locationMessage,
          id: `temp_${Date.now()}`,
          timestamp: Date.now(),
          readBy: [user.id],
        }));
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'send_location');
      Alert.alert('Error', 'Failed to send location. Please try again.');
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.senderId === user?.id;
    const messageTime = new Date(item.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {item.messageType === 'location' && (
            <View style={styles.locationMessage}>
              <Text style={styles.locationText}>📍 Location Shared</Text>
              <Text style={styles.locationCoords}>
                {item.location?.latitude.toFixed(6)}, {item.location?.longitude.toFixed(6)}
              </Text>
            </View>
          )}
          
          {item.messageType === 'image' && (
            <View style={styles.imageMessage}>
              <Text style={styles.imageText}>📷 {item.fileName}</Text>
            </View>
          )}
          
          {item.messageType === 'text' && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
          )}
          
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {messageTime}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (roomTypingUsers.length === 0) return null;

    const typingNames = roomTypingUsers
      .filter(u => u.userId !== user?.id)
      .map(u => u.userName)
      .join(', ');

    if (!typingNames) return null;

    return (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingNames} {roomTypingUsers.length === 1 ? 'is' : 'are'} typing...
        </Text>
      </View>
    );
  };

  const renderConnectionStatus = () => {
    if (isConnected) return null;

    return (
      <View style={styles.connectionBanner}>
        <Text style={styles.connectionText}>
          🔴 Disconnected - Messages will be sent when connection is restored
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{roomName}</Text>
        <View style={styles.headerRight}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: isConnected ? COLORS.success : COLORS.error }
          ]} />
        </View>
      </View>

      {renderConnectionStatus()}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={roomMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {renderTypingIndicator()}

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={(text) => {
              setMessageText(text);
              if (text.trim()) {
                handleTypingStart();
              } else {
                handleTypingStop();
              }
            }}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSendImage}
          >
            <Text style={styles.actionButtonText}>📷</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSendLocation}
          >
            <Text style={styles.actionButtonText}>📍</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !messageText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : SPACING.sm,
  },
  backButton: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  headerTitle: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  headerRight: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionBanner: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  connectionText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
  },
  messageContainer: {
    marginBottom: SPACING.md,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
  },
  otherBubble: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  messageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
  },
  ownMessageText: {
    color: COLORS.textInverse,
  },
  otherMessageText: {
    color: COLORS.textPrimary,
  },
  messageTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  ownMessageTime: {
    color: COLORS.textInverse + '80',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: COLORS.textSecondary,
  },
  locationMessage: {
    alignItems: 'center',
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  locationCoords: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textInverse + '80',
    marginTop: SPACING.xs,
    fontFamily: 'monospace',
  },
  imageMessage: {
    alignItems: 'center',
  },
  imageText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textInverse,
  },
  typingContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  typingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    maxHeight: 100,
    marginRight: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  sendButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ChatScreen;
