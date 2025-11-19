/**
 * Chat Service - Handles communication between Admin, Client, and Guard
 * Communication Hierarchy: Admin ↔ Client ↔ Guard
 */

export interface ChatParticipant {
  id: string;
  name: string;
  role: 'ADMIN' | 'CLIENT' | 'GUARD';
  avatar?: string;
  isOnline?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: ChatParticipant[];
  type: 'direct' | 'group' | 'report' | 'site';
  context?: {
    reportId?: string;
    siteId?: string;
    incidentId?: string;
  };
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'ADMIN' | 'CLIENT' | 'GUARD';
  message: string;
  messageType: 'text' | 'image' | 'location' | 'file';
  timestamp: number;
  readBy: string[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

class ChatService {
  private baseUrl = 'http://localhost:3000/api';

  /**
   * Get chat rooms for current user based on their role
   */
  async getChatRooms(userId: string, userRole: string): Promise<ChatRoom[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/rooms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms');
      }

      const data = await response.json();
      return data.rooms || [];
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      // Return mock data for development
      return this.getMockChatRooms(userId, userRole);
    }
  }

  /**
   * Create a chat room between client and guard (via report or site)
   */
  async createClientGuardChat(
    clientId: string,
    guardId: string,
    context: 'report' | 'site',
    contextId: string
  ): Promise<ChatRoom> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          type: context,
          participants: [clientId, guardId],
          context: {
            [context === 'report' ? 'reportId' : 'siteId']: contextId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat room');
      }

      const data = await response.json();
      return data.room;
    } catch (error) {
      console.error('Error creating chat room:', error);
      // Return mock room for development
      return this.getMockChatRoom(clientId, guardId, context, contextId);
    }
  }

  /**
   * Create admin-client chat room
   */
  async createAdminClientChat(adminId: string, clientId: string): Promise<ChatRoom> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          type: 'direct',
          participants: [adminId, clientId],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create admin-client chat');
      }

      const data = await response.json();
      return data.room;
    } catch (error) {
      console.error('Error creating admin-client chat:', error);
      return this.getMockChatRoom(adminId, clientId, 'direct');
    }
  }

  /**
   * Get messages for a chat room
   */
  async getMessages(roomId: string, page = 1, limit = 50): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return this.getMockMessages(roomId);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp' | 'readBy'>): Promise<ChatMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      // Return mock message for development
      return {
        ...message,
        id: `msg_${Date.now()}`,
        timestamp: Date.now(),
        readBy: [message.senderId],
      };
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/chat/rooms/${roomId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({ userId }),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Mock data methods for development
  private getMockChatRooms(userId: string, userRole: string): ChatRoom[] {
    const mockRooms: ChatRoom[] = [];

    if (userRole === 'CLIENT') {
      mockRooms.push(
        {
          id: 'client_guard_1',
          name: 'Mark Husdon',
          type: 'report',
          participants: [
            { id: userId, name: 'You', role: 'CLIENT' },
            { id: 'guard_1', name: 'Mark Husdon', role: 'GUARD', isOnline: true },
          ],
          context: { reportId: 'report_1' },
          lastMessage: 'Report acknowledged, investigating now.',
          lastMessageTime: new Date(Date.now() - 300000),
          unreadCount: 0,
        },
        {
          id: 'client_admin_1',
          name: 'Security Admin',
          type: 'direct',
          participants: [
            { id: userId, name: 'You', role: 'CLIENT' },
            { id: 'admin_1', name: 'Security Admin', role: 'ADMIN', isOnline: false },
          ],
          lastMessage: 'Your service request has been processed.',
          lastMessageTime: new Date(Date.now() - 3600000),
          unreadCount: 1,
        }
      );
    }

    if (userRole === 'GUARD') {
      mockRooms.push(
        {
          id: 'client_guard_1',
          name: 'Client Company',
          type: 'report',
          participants: [
            { id: 'client_1', name: 'Client Company', role: 'CLIENT' },
            { id: userId, name: 'You', role: 'GUARD' },
          ],
          context: { reportId: 'report_1' },
          lastMessage: 'Can you provide more details about the incident?',
          lastMessageTime: new Date(Date.now() - 600000),
          unreadCount: 2,
        }
      );
    }

    if (userRole === 'ADMIN') {
      mockRooms.push(
        {
          id: 'client_admin_1',
          name: 'ABC Corporation',
          type: 'direct',
          participants: [
            { id: 'client_1', name: 'ABC Corporation', role: 'CLIENT' },
            { id: userId, name: 'You', role: 'ADMIN' },
          ],
          lastMessage: 'We need additional security coverage for next week.',
          lastMessageTime: new Date(Date.now() - 1800000),
          unreadCount: 0,
        }
      );
    }

    return mockRooms;
  }

  private getMockChatRoom(
    userId1: string,
    userId2: string,
    type: 'report' | 'site' | 'direct',
    contextId?: string
  ): ChatRoom {
    return {
      id: `${userId1}_${userId2}_${Date.now()}`,
      name: 'New Chat',
      type,
      participants: [
        { id: userId1, name: 'User 1', role: 'CLIENT' },
        { id: userId2, name: 'User 2', role: 'GUARD' },
      ],
      context: contextId ? { [type === 'report' ? 'reportId' : 'siteId']: contextId } : undefined,
      unreadCount: 0,
    };
  }

  private getMockMessages(roomId: string): ChatMessage[] {
    return [
      {
        id: 'msg_1',
        roomId,
        senderId: 'guard_1',
        senderName: 'Mark Husdon',
        senderRole: 'GUARD',
        message: 'I have received the incident report and am investigating.',
        messageType: 'text',
        timestamp: Date.now() - 600000,
        readBy: ['guard_1', 'client_1'],
      },
      {
        id: 'msg_2',
        roomId,
        senderId: 'client_1',
        senderName: 'Client',
        senderRole: 'CLIENT',
        message: 'Thank you. Please keep me updated on the progress.',
        messageType: 'text',
        timestamp: Date.now() - 300000,
        readBy: ['client_1'],
      },
    ];
  }

  private getToken(): string {
    // In a real app, get this from secure storage
    return 'mock_token';
  }
}

export const chatService = new ChatService();
export default chatService;
