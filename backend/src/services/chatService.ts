import prisma from '../config/database.js';
import WebSocketService from './websocketService.js';
import { logger } from '../utils/logger.js';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'location' | 'system';
  timestamp: Date;
  isRead: boolean;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
}

export interface Chat {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'team';
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  role: 'member' | 'admin';
  joinedAt: Date;
  lastReadAt?: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: string;
  };
}

export class ChatService {
  private static instance: ChatService;
  private websocketService: any;

  constructor() {
    this.websocketService = WebSocketService;
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Get all chats for a user
   * Uses Message model with conversationId to group conversations
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      // Get all unique conversations where user has sent or received messages
      const userMessages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            // For now, we'll use conversationId to identify chats
            // In a full implementation, you'd have a Conversation/Chat model
          ],
        },
        select: {
          conversationId: true,
          senderId: true,
          createdAt: true,
        },
        distinct: ['conversationId'],
        orderBy: { createdAt: 'desc' },
      });

      // Get unique conversation IDs
      const conversationIds = [...new Set(userMessages.map(m => m.conversationId))];

      // For each conversation, get the latest message and participants
      const chats: Chat[] = await Promise.all(
        conversationIds.map(async (conversationId) => {
          // Get latest message in this conversation
          const lastMessage = await prisma.message.findFirst({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          });

          // Get all unique participants (senders) in this conversation
          const participantsData = await prisma.message.findMany({
            where: { conversationId },
            select: {
              senderId: true,
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            distinct: ['senderId'],
          });

          // Count unread messages for this user
          const unreadCount = await prisma.message.count({
            where: {
              conversationId,
              senderId: { not: userId },
              isRead: false,
            },
          });

          // Determine chat name (for direct chats, use other participant's name)
          let chatName: string | undefined;
          const otherParticipant = participantsData.find(p => p.senderId !== userId);
          if (otherParticipant?.sender) {
            chatName = `${otherParticipant.sender.firstName} ${otherParticipant.sender.lastName}`.trim();
          } else {
            chatName = 'Chat';
          }

          // Build participants list
          const participants: ChatParticipant[] = participantsData.map((p) => ({
            id: `part_${p.senderId}_${conversationId}`,
            chatId: conversationId,
            userId: p.senderId,
            role: p.senderId === userId ? 'admin' : 'member',
            joinedAt: new Date(), // Would need a join date in a full implementation
            lastReadAt: undefined,
            user: {
              id: p.sender.id,
              firstName: p.sender.firstName,
              lastName: p.sender.lastName,
              role: p.sender.role,
            },
          }));

          const chat: Chat = {
            id: conversationId,
            name: chatName,
            type: participants.length === 2 ? 'direct' : 'group',
            participants,
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              chatId: conversationId,
              senderId: lastMessage.senderId,
              content: lastMessage.content,
              messageType: 'text', // Default to text, would need to add messageType to schema
              timestamp: lastMessage.createdAt,
              isRead: lastMessage.isRead,
              sender: {
                id: lastMessage.sender.id,
                firstName: lastMessage.sender.firstName,
                lastName: lastMessage.sender.lastName,
                role: lastMessage.sender.role,
              },
            } : undefined,
            lastMessageAt: lastMessage?.createdAt,
            unreadCount,
            createdAt: lastMessage?.createdAt || new Date(),
            updatedAt: lastMessage?.createdAt || new Date(),
          };

          return chat;
        })
      );

      return chats;
    } catch (error) {
      logger.error('Error getting user chats:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific chat
   */
  async getChatMessages(chatId: string, userId: string, page: number = 1, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const skip = (page - 1) * limit;

      // Verify user has access to this conversation
      const hasAccess = await prisma.message.findFirst({
        where: {
          conversationId: chatId,
          senderId: userId,
        },
      });

      if (!hasAccess) {
        // Check if user is a recipient (would need recipientId in schema for full implementation)
        // For now, allow if conversation exists
        const conversationExists = await prisma.message.findFirst({
          where: { conversationId: chatId },
        });

        if (!conversationExists) {
          throw new Error('Chat not found or access denied');
        }
      }

      // Fetch messages from database
      const messages = await prisma.message.findMany({
        where: { conversationId: chatId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Transform to ChatMessage format
      const chatMessages: ChatMessage[] = messages.reverse().map((msg) => ({
        id: msg.id,
        chatId: msg.conversationId,
        senderId: msg.senderId,
        content: msg.content,
        messageType: 'text', // Default - would need messageType in schema
        timestamp: msg.createdAt,
        isRead: msg.isRead,
        sender: {
          id: msg.sender.id,
          firstName: msg.sender.firstName,
          lastName: msg.sender.lastName,
          role: msg.sender.role,
        },
      }));

      return chatMessages;
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(data: {
    chatId: string;
    senderId: string;
    content: string;
    messageType: 'text' | 'image' | 'file' | 'location';
  }): Promise<ChatMessage> {
    try {
      // Create message in database
      const message = await prisma.message.create({
        data: {
          senderId: data.senderId,
          conversationId: data.chatId,
          content: data.content,
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      // Transform to ChatMessage format
      const chatMessage: ChatMessage = {
        id: message.id,
        chatId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        messageType: data.messageType,
        timestamp: message.createdAt,
        isRead: message.isRead,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          role: message.sender.role,
        },
      };

      // Broadcast message to chat participants via WebSocket
      this.websocketService.broadcastToRoom(`chat_${data.chatId}`, 'new_message', {
        message: chatMessage,
        chatId: data.chatId
      });

      logger.info(`Message sent in chat ${data.chatId} by user ${data.senderId}`);

      return chatMessage;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<void> {
    try {
      // Update messages as read in database
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          conversationId: chatId,
          senderId: { not: userId }, // Only mark messages from others as read
        },
        data: {
          isRead: true,
        },
      });

      logger.info(`Marked ${messageIds.length} messages as read in chat ${chatId} for user ${userId}`);

      // Broadcast read status to other participants
      this.websocketService.broadcastToRoom(`chat_${chatId}`, 'messages_read', {
        chatId,
        userId,
        messageIds,
        readAt: new Date()
      });
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Create a new chat
   * Creates a conversation by sending an initial message
   */
  async createChat(data: {
    type: 'direct' | 'group' | 'team';
    name?: string;
    participantIds: string[];
    createdBy: string;
  }): Promise<Chat> {
    try {
      // Generate conversation ID
      const chatId = `chat_${data.createdBy}_${data.participantIds.sort().join('_')}_${Date.now()}`;
      
      // Create initial system message to establish the conversation
      const initialMessage = await prisma.message.create({
        data: {
          senderId: data.createdBy,
          conversationId: chatId,
          content: data.name || 'Chat started',
          isRead: false,
        },
      });

      // Get all participants' user data
      const participants = await prisma.user.findMany({
        where: {
          id: { in: [...data.participantIds, data.createdBy] },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      // Build participants list
      const chatParticipants: ChatParticipant[] = participants.map((user) => ({
        id: `part_${user.id}_${chatId}`,
        chatId,
        userId: user.id,
        role: user.id === data.createdBy ? 'admin' : 'member',
        joinedAt: new Date(),
        lastReadAt: undefined,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      }));

      // Determine chat name
      let chatName = data.name;
      if (!chatName && data.type === 'direct' && participants.length === 2) {
        const otherParticipant = participants.find(p => p.id !== data.createdBy);
        if (otherParticipant) {
          chatName = `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim();
        }
      }

      const chat: Chat = {
        id: chatId,
        name: chatName,
        type: data.type,
        participants: chatParticipants,
        lastMessage: {
          id: initialMessage.id,
          chatId,
          senderId: initialMessage.senderId,
          content: initialMessage.content,
          messageType: 'text',
          timestamp: initialMessage.createdAt,
          isRead: false,
          sender: {
            id: participants.find(p => p.id === initialMessage.senderId)?.id || '',
            firstName: participants.find(p => p.id === initialMessage.senderId)?.firstName || '',
            lastName: participants.find(p => p.id === initialMessage.senderId)?.lastName || '',
            role: participants.find(p => p.id === initialMessage.senderId)?.role || 'GUARD',
          },
        },
        lastMessageAt: initialMessage.createdAt,
        unreadCount: 0,
        createdAt: initialMessage.createdAt,
        updatedAt: initialMessage.createdAt,
      };

      // Notify participants about new chat
      data.participantIds.forEach(userId => {
        this.websocketService.broadcastToUser(userId, 'new_chat', { chat });
      });

      logger.info(`New chat created: ${chatId} by user ${data.createdBy}`);

      return chat;
    } catch (error) {
      logger.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Search chats and messages
   */
  async searchChats(userId: string, query: string): Promise<{
    chats: Chat[];
    messages: ChatMessage[];
  }> {
    try {
      const userChats = await this.getUserChats(userId);
      
      // Filter chats by name or participant name
      const filteredChats = userChats.filter(chat => 
        chat.name?.toLowerCase().includes(query.toLowerCase()) ||
        chat.participants.some(p => 
          `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(query.toLowerCase())
        )
      );

      // Mock message search - in real app, search message content
      const messages: ChatMessage[] = [];

      return {
        chats: filteredChats,
        messages
      };
    } catch (error) {
      logger.error('Error searching chats:', error);
      throw error;
    }
  }

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId: string): Promise<Chat | null> {
    try {
      const userChats = await this.getUserChats(userId);
      return userChats.find(chat => chat.id === chatId) || null;
    } catch (error) {
      logger.error('Error getting chat by ID:', error);
      throw error;
    }
  }
}

export default ChatService;
