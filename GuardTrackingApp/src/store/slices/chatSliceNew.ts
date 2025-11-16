import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'location';
  timestamp: string;
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
  participants: any[];
  lastMessage?: ChatMessage;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: { [chatId: string]: ChatMessage[] };
  loading: boolean;
  error: string | null;
  searchResults: {
    chats: Chat[];
    messages: ChatMessage[];
  };
}

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: {},
  loading: false,
  error: null,
  searchResults: {
    chats: [],
    messages: [],
  },
};

// Async thunks for API calls (mocked for now)
export const fetchUserChats = createAsyncThunk(
  'chat/fetchUserChats',
  async (_, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      const mockChats: Chat[] = [
        {
          id: 'chat_1',
          name: 'My First Client',
          type: 'direct',
          participants: [],
          lastMessage: {
            id: 'msg_1',
            chatId: 'chat_1',
            senderId: 'client_1',
            content: 'Lorem ipsum dolor sit amet consectetur.',
            messageType: 'text',
            timestamp: new Date().toISOString(),
            isRead: false,
            sender: {
              id: 'client_1',
              firstName: 'My First',
              lastName: 'Client',
              role: 'CLIENT'
            }
          },
          lastMessageAt: new Date().toISOString(),
          unreadCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return mockChats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chats');
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async ({ chatId, page = 1 }: { chatId: string; page?: number }, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API
      await new Promise<void>(resolve => setTimeout(resolve, 800));
      
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg_1',
          chatId,
          senderId: 'client_1',
          content: 'Lorem ipsum dolor sit amet consectetur. Gravida viverra.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          isRead: true,
          sender: {
            id: 'client_1',
            firstName: 'My First',
            lastName: 'Client',
            role: 'CLIENT'
          }
        },
        {
          id: 'msg_2',
          chatId,
          senderId: 'current_user',
          content: 'Lorem ipsum dolor sit amet consectetur. Velit bibendum maecenas platea diam.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          isRead: true,
          sender: {
            id: 'current_user',
            firstName: 'John',
            lastName: 'Guard',
            role: 'GUARD'
          }
        }
      ];
      
      return { chatId, messages: mockMessages, page };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { chatId, content, messageType = 'text' }: 
    { chatId: string; content: string; messageType?: 'text' | 'image' | 'file' | 'location' },
    { rejectWithValue }
  ) => {
    try {
      // Mock API call - replace with actual API
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        chatId,
        senderId: 'current_user',
        content,
        messageType,
        timestamp: new Date().toISOString(),
        isRead: false,
        sender: {
          id: 'current_user',
          firstName: 'John',
          lastName: 'Guard',
          role: 'GUARD'
        }
      };
      
      return newMessage;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  async (
    { chatId, messageIds }: { chatId: string; messageIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      // Mock API call - replace with actual API
      await new Promise<void>(resolve => setTimeout(resolve, 300));
      
      return { chatId, messageIds };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark messages as read');
    }
  }
);

export const searchChats = createAsyncThunk(
  'chat/searchChats',
  async (query: string, { rejectWithValue }) => {
    try {
      // Mock API call - replace with actual API
      await new Promise<void>(resolve => setTimeout(resolve, 600));
      
      // Mock search results
      const results = {
        chats: [],
        messages: []
      };
      
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search chats');
    }
  }
);

export const createChat = createAsyncThunk(
  'chat/createChat',
  async (
    { type, name, participantIds }: 
    { type: 'direct' | 'group' | 'team'; name?: string; participantIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      // Mock API call - replace with actual API
      await new Promise<void>(resolve => setTimeout(resolve, 800));
      
      const newChat: Chat = {
        id: `chat_${Date.now()}`,
        name,
        type,
        participants: [],
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return newChat;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create chat');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const message = action.payload;
      if (!state.messages[message.chatId]) {
        state.messages[message.chatId] = [];
      }
      state.messages[message.chatId].push(message);
      
      // Update last message in chat
      const chatIndex = state.chats.findIndex(chat => chat.id === message.chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].lastMessageAt = message.timestamp;
        if (message.senderId !== 'current_user') {
          state.chats[chatIndex].unreadCount += 1;
        }
      }
    },
    updateMessageStatus: (state, action: PayloadAction<{ chatId: string; messageId: string; isRead: boolean }>) => {
      const { chatId, messageId, isRead } = action.payload;
      if (state.messages[chatId]) {
        const messageIndex = state.messages[chatId].findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          state.messages[chatId][messageIndex].isRead = isRead;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSearchResults: (state) => {
      state.searchResults = { chats: [], messages: [] };
    },
  },
  extraReducers: (builder) => {
    // Fetch user chats
    builder
      .addCase(fetchUserChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch chat messages
    builder
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages } = action.payload;
        state.messages[chatId] = messages;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        if (!state.messages[message.chatId]) {
          state.messages[message.chatId] = [];
        }
        state.messages[message.chatId].push(message);
        
        // Update last message in chat
        const chatIndex = state.chats.findIndex(chat => chat.id === message.chatId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].lastMessage = message;
          state.chats[chatIndex].lastMessageAt = message.timestamp;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Mark messages as read
    builder
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { chatId, messageIds } = action.payload;
        if (state.messages[chatId]) {
          state.messages[chatId].forEach(message => {
            if (messageIds.includes(message.id)) {
              message.isRead = true;
            }
          });
        }
        
        // Update unread count
        const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].unreadCount = Math.max(0, state.chats[chatIndex].unreadCount - messageIds.length);
        }
      });

    // Search chats
    builder
      .addCase(searchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create chat
    builder
      .addCase(createChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.loading = false;
        state.chats.unshift(action.payload);
      })
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentChat,
  addMessage,
  updateMessageStatus,
  clearError,
  resetSearchResults,
} = chatSlice.actions;

export default chatSlice.reducer;
