/**
 * Chat Redux Slice
 * Manages real-time messaging state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'GUARD' | 'ADMIN' | 'CLIENT';
  recipientId?: string;
  roomId: string;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'location' | 'emergency';
  timestamp: number;
  readBy: string[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'support';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface ChatState {
  messages: { [roomId: string]: ChatMessage[] };
  rooms: ChatRoom[];
  activeRoomId: string | null;
  typingUsers: { [roomId: string]: TypingUser[] };
  isConnected: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: {},
  rooms: [],
  activeRoomId: null,
  typingUsers: {},
  isConnected: false,
  loading: false,
  error: null,
};

// Async thunks for chat operations
export const fetchChatRooms = createAsyncThunk(
  'chat/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      // This would typically fetch from API
      // For now, return default support room
      const defaultRooms: ChatRoom[] = [
        {
          id: 'support',
          name: 'Support',
          type: 'support',
          participants: ['current_user', 'admin'],
          unreadCount: 0,
          isActive: true,
        },
      ];
      return defaultRooms;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chat rooms');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (roomId: string, { rejectWithValue }) => {
    try {
      // This would typically fetch from API
      // For now, return empty array
      return { roomId, messages: [] };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // WebSocket event handlers
    messageReceived: (state, action: PayloadAction<ChatMessage>) => {
      const message = action.payload;
      const roomId = message.roomId;
      
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      // Add message if not already exists
      const exists = state.messages[roomId].find(m => m.id === message.id);
      if (!exists) {
        state.messages[roomId].push(message);
        
        // Update room's last message and unread count
        const room = state.rooms.find(r => r.id === roomId);
        if (room) {
          room.lastMessage = message;
          if (roomId !== state.activeRoomId) {
            room.unreadCount += 1;
          }
        }
      }
    },

    messageSent: (state, action: PayloadAction<ChatMessage>) => {
      const message = action.payload;
      const roomId = message.roomId;
      
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      state.messages[roomId].push(message);
      
      // Update room's last message
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.lastMessage = message;
      }
    },

    typingIndicator: (state, action: PayloadAction<{
      userId: string;
      userName: string;
      roomId: string;
      isTyping: boolean;
      timestamp: number;
    }>) => {
      const { userId, userName, roomId, isTyping, timestamp } = action.payload;
      
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }
      
      if (isTyping) {
        // Add or update typing user
        const existingIndex = state.typingUsers[roomId].findIndex(u => u.userId === userId);
        const typingUser: TypingUser = { userId, userName, timestamp };
        
        if (existingIndex >= 0) {
          state.typingUsers[roomId][existingIndex] = typingUser;
        } else {
          state.typingUsers[roomId].push(typingUser);
        }
      } else {
        // Remove typing user
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(u => u.userId !== userId);
      }
    },

    messageRead: (state, action: PayloadAction<{
      messageId: string;
      userId: string;
      timestamp: number;
    }>) => {
      const { messageId, userId } = action.payload;
      
      // Find and update message read status
      Object.keys(state.messages).forEach(roomId => {
        const message = state.messages[roomId].find(m => m.id === messageId);
        if (message && !message.readBy.includes(userId)) {
          message.readBy.push(userId);
        }
      });
    },

    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoomId = action.payload;
      
      // Mark messages as read for active room
      if (action.payload) {
        const room = state.rooms.find(r => r.id === action.payload);
        if (room) {
          room.unreadCount = 0;
        }
      }
    },

    clearMessages: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      if (state.messages[roomId]) {
        state.messages[roomId] = [];
      }
    },

    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Clean up old typing indicators
    cleanupTypingIndicators: (state) => {
      const now = Date.now();
      const timeout = 5000; // 5 seconds
      
      Object.keys(state.typingUsers).forEach(roomId => {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(
          user => now - user.timestamp < timeout
        );
      });
    },

    addRoom: (state, action: PayloadAction<ChatRoom>) => {
      const room = action.payload;
      const exists = state.rooms.find(r => r.id === room.id);
      if (!exists) {
        state.rooms.push(room);
      }
    },

    updateRoom: (state, action: PayloadAction<Partial<ChatRoom> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const room = state.rooms.find(r => r.id === id);
      if (room) {
        Object.assign(room, updates);
      }
    },

    userJoined: (state, action: PayloadAction<{
      userId: string;
      userName: string;
      roomId: string;
    }>) => {
      const { userId, roomId } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room && !room.participants.includes(userId)) {
        room.participants.push(userId);
      }
    },

    userLeft: (state, action: PayloadAction<{
      userId: string;
      userName: string;
      roomId: string;
    }>) => {
      const { userId, roomId } = action.payload;
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.participants = room.participants.filter(p => p !== userId);
      }
    },
  },

  extraReducers: (builder) => {
    // Fetch chat rooms
    builder
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
        state.error = null;
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { roomId, messages } = action.payload;
        state.messages[roomId] = messages;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  messageReceived,
  messageSent,
  typingIndicator,
  messageRead,
  setActiveRoom,
  clearMessages,
  setConnectionStatus,
  clearError,
  cleanupTypingIndicators,
  addRoom,
  updateRoom,
  userJoined,
  userLeft,
} = chatSlice.actions;

export default chatSlice.reducer;
export type { ChatMessage, ChatRoom, TypingUser, ChatState };
