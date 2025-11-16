import { PrismaClient } from '@prisma/client';
import WebSocketService from './websocketService.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

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
   */
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      // Mock data for now - replace with actual Prisma queries
      const mockChats: Chat[] = [
        {
          id: 'chat_1',
          name: 'My First Client',
          type: 'direct',
          participants: [
            {
              id: 'part_1',
              chatId: 'chat_1',
              userId: userId,
              role: 'member',
              joinedAt: new Date(),
              user: {
                id: userId,
                firstName: 'John',
                lastName: 'Guard',
                role: 'GUARD'
              }
            },
            {
              id: 'part_2',
              chatId: 'chat_1',
              userId: 'client_1',
              role: 'member',
              joinedAt: new Date(),
              user: {
                id: 'client_1',
                firstName: 'My First',
                lastName: 'Client',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                role: 'CLIENT'
              }
            }
          ],
          lastMessage: {
            id: 'msg_1',
            chatId: 'chat_1',
            senderId: 'client_1',
            content: 'Lorem ipsum dolor sit amet consectetur.',
            messageType: 'text',
            timestamp: new Date(),
            isRead: false,
            sender: {
              id: 'client_1',
              firstName: 'My First',
              lastName: 'Client',
              role: 'CLIENT'
            }
          },
          lastMessageAt: new Date(),
          unreadCount: 2,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'chat_2',
          name: 'Harley T.',
          type: 'direct',
          participants: [
            {
              id: 'part_3',
              chatId: 'chat_2',
              userId: userId,
              role: 'member',
              joinedAt: new Date(),
              user: {
                id: userId,
                firstName: 'John',
                lastName: 'Guard',
                role: 'GUARD'
              }
            },
            {
              id: 'part_4',
              chatId: 'chat_2',
              userId: 'user_2',
              role: 'member',
              joinedAt: new Date(),
              user: {
                id: 'user_2',
                firstName: 'Harley',
                lastName: 'T.',
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                role: 'ADMIN'
              }
            }
          ],
          lastMessage: {
            id: 'msg_2',
            chatId: 'chat_2',
            senderId: 'user_2',
            content: 'Lorem ipsum dolor sit amet consectetur.',
            messageType: 'text',
            timestamp: new Date(Date.now() - 60000), // 1 minute ago
            isRead: true,
            sender: {
              id: 'user_2',
              firstName: 'Harley',
              lastName: 'T.',
              role: 'ADMIN'
            }
          },
          lastMessageAt: new Date(Date.now() - 60000),
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'chat_3',
          name: 'Oliver Smith',
          type: 'direct',
          participants: [
            {
              id: 'part_5',
              chatId: 'chat_3',
              userId: userId,
              role: 'member',
              joinedAt: new Date(),
              user: {
                id: userId,
                firstName: 'John',
                lastName: 'Guard',
                role: 'GUARD'
              }
            },
            {
              id: 'part_6',
              chatId: 'chat_3',
              userId: 'user_3',
              role: 'member',
              joinedAt: new Date(),
              user: {
                id: 'user_3',
                firstName: 'Oliver',
                lastName: 'Smith',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                role: 'GUARD'
              }
            }
          ],
          lastMessage: {
            id: 'msg_3',
            chatId: 'chat_3',
            senderId: 'user_3',
            content: 'Lorem ipsum dolor sit amet consectetur.',
            messageType: 'text',
            timestamp: new Date(Date.now() - 86400000), // Yesterday
            isRead: true,
            sender: {
              id: 'user_3',
              firstName: 'Oliver',
              lastName: 'Smith',
              role: 'GUARD'
            }
          },
          lastMessageAt: new Date(Date.now() - 86400000),
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'chat_4',
          name: 'Amelia Johnson',
          type: 'direct',
          participants: [
            {
              id: 'part_7',
              chatId: 'chat_4',
              userId: userId,
              role: 'member',
              joinedAt: new Date(),
              user: {
                id: userId,
                firstName: 'John',
                lastName: 'Guard',
                role: 'GUARD'
              }
            },
            {
              id: 'part_8',
              chatId: 'chat_4',
              userId: 'user_4',
              role: 'member',
              joinedAt: new Date(),
              user: {
                id: 'user_4',
                firstName: 'Amelia',
                lastName: 'Johnson',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                role: 'CLIENT'
              }
            }
          ],
          lastMessage: {
            id: 'msg_4',
            chatId: 'chat_4',
            senderId: 'user_4',
            content: 'Lorem ipsum dolor sit amet consectetur.',
            messageType: 'text',
            timestamp: new Date(),
            isRead: false,
            sender: {
              id: 'user_4',
              firstName: 'Amelia',
              lastName: 'Johnson',
              role: 'CLIENT'
            }
          },
          lastMessageAt: new Date(),
          unreadCount: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      return mockChats;
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
      // Mock messages for the chat
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg_1',
          chatId,
          senderId: 'client_1',
          content: 'Lorem ipsum dolor sit amet consectetur. Gravida viverra.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          isRead: true,
          sender: {
            id: 'client_1',
            firstName: 'My First',
            lastName: 'Client',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            role: 'CLIENT'
          }
        },
        {
          id: 'msg_2',
          chatId,
          senderId: userId,
          content: 'Lorem ipsum dolor sit amet consectetur. Velit bibendum maecenas platea diam.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 240000), // 4 minutes ago
          isRead: true,
          sender: {
            id: userId,
            firstName: 'John',
            lastName: 'Guard',
            role: 'GUARD'
          }
        },
        {
          id: 'msg_3',
          chatId,
          senderId: userId,
          content: 'Lorem ipsum dolor sit amet consectetur. Velit bibendum maecenas platea diam.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 180000), // 3 minutes ago
          isRead: true,
          sender: {
            id: userId,
            firstName: 'John',
            lastName: 'Guard',
            role: 'GUARD'
          }
        },
        {
          id: 'msg_4',
          chatId,
          senderId: 'client_1',
          content: 'Lorem ipsum dolor sit amet consectetur. Gravida viverra.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 120000), // 2 minutes ago
          isRead: true,
          sender: {
            id: 'client_1',
            firstName: 'My First',
            lastName: 'Client',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            role: 'CLIENT'
          }
        },
        {
          id: 'msg_5',
          chatId,
          senderId: 'client_1',
          content: 'Lorem ipsum dolor sit amet consectetur. Gravida viverra.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 60000), // 1 minute ago
          isRead: true,
          sender: {
            id: 'client_1',
            firstName: 'My First',
            lastName: 'Client',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            role: 'CLIENT'
          }
        },
        {
          id: 'msg_6',
          chatId,
          senderId: userId,
          content: 'Lorem ipsum dolor sit amet consectetur. Velit bibendum maecenas platea diam.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 30000), // 30 seconds ago
          isRead: false,
          sender: {
            id: userId,
            firstName: 'John',
            lastName: 'Guard',
            role: 'GUARD'
          }
        },
        {
          id: 'msg_7',
          chatId,
          senderId: userId,
          content: 'Lorem ipsum dolor sit amet consectetur. Velit bibendum maecenas platea diam.',
          messageType: 'text',
          timestamp: new Date(),
          isRead: false,
          sender: {
            id: userId,
            firstName: 'John',
            lastName: 'Guard',
            role: 'GUARD'
          }
        }
      ];

      return mockMessages;
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
      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        chatId: data.chatId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType,
        timestamp: new Date(),
        isRead: false,
        sender: {
          id: data.senderId,
          firstName: 'John',
          lastName: 'Guard',
          role: 'GUARD'
        }
      };

      // Broadcast message to chat participants via WebSocket
      this.websocketService.broadcastToRoom(`chat_${data.chatId}`, 'new_message', {
        message,
        chatId: data.chatId
      });

      logger.info(`Message sent in chat ${data.chatId} by user ${data.senderId}`);

      return message;
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
      // Mock implementation - in real app, update database
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
   */
  async createChat(data: {
    type: 'direct' | 'group' | 'team';
    name?: string;
    participantIds: string[];
    createdBy: string;
  }): Promise<Chat> {
    try {
      const chatId = `chat_${Date.now()}`;
      
      const chat: Chat = {
        id: chatId,
        name: data.name,
        type: data.type,
        participants: data.participantIds.map((userId, index) => ({
          id: `part_${Date.now()}_${index}`,
          chatId,
          userId,
          role: userId === data.createdBy ? 'admin' : 'member',
          joinedAt: new Date(),
          user: {
            id: userId,
            firstName: 'User',
            lastName: `${index + 1}`,
            role: 'GUARD'
          }
        })),
        unreadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
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
