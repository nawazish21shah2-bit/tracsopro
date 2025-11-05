// Message Management Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Message, MessageState, Conversation } from '../../types';
import apiService from '../../services/api';

// Initial state
const initialState: MessageState = {
  messages: [],
  conversations: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (conversationId?: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getMessages(conversationId);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch messages');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async (messageData: {
    recipientId: string;
    content: string;
    type: string;
    attachments?: any[];
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.sendMessage(messageData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to send message');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

// Message slice
const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action: PayloadAction<{ id: string; message: Partial<Message> }>) => {
      const { id, message } = action.payload;
      const index = state.messages.findIndex(msg => msg.id === id);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...message };
      }
    },
    markMessageAsRead: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      const message = state.messages.find(msg => msg.id === messageId);
      if (message) {
        message.isRead = true;
      }
    },
    markConversationAsRead: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversation = state.conversations.find(conv => conv.id === conversationId);
      if (conversation) {
        conversation.unreadCount = 0;
      }
      // Mark all messages in this conversation as read
      state.messages.forEach(message => {
        if (message.senderId === conversationId || message.recipientId === conversationId) {
          message.isRead = true;
        }
      });
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      const existingIndex = state.conversations.findIndex(conv => conv.id === action.payload.id);
      if (existingIndex !== -1) {
        state.conversations[existingIndex] = action.payload;
      } else {
        state.conversations.push(action.payload);
      }
    },
    updateConversation: (state, action: PayloadAction<{ id: string; conversation: Partial<Conversation> }>) => {
      const { id, conversation } = action.payload;
      const index = state.conversations.findIndex(conv => conv.id === id);
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...conversation };
      }
    },
    clearMessages: (state) => {
      state.messages = [];
      state.conversations = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.push(action.payload);
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setLoading, 
  addMessage, 
  updateMessage, 
  markMessageAsRead, 
  markConversationAsRead, 
  addConversation, 
  updateConversation, 
  clearMessages 
} = messageSlice.actions;
export default messageSlice.reducer;
