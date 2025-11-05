// Notification Management Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationState, NotificationType } from '../../types';
import apiService from '../../services/api';

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getNotifications();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch notifications');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response.success) {
        return notificationId;
      } else {
        return rejectWithValue(response.message || 'Failed to mark notification as read');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

// Notification slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    updateNotification: (state, action: PayloadAction<{ id: string; notification: Partial<Notification> }>) => {
      const { id, notification } = action.payload;
      const index = state.notifications.findIndex(notif => notif.id === id);
      if (index !== -1) {
        const wasRead = state.notifications[index].isRead;
        state.notifications[index] = { ...state.notifications[index], ...notification };
        
        // Update unread count if read status changed
        if (!wasRead && notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (wasRead && !notification.isRead) {
          state.unreadCount += 1;
        }
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
    },
    filterNotificationsByType: (state, action: PayloadAction<NotificationType>) => {
      const type = action.payload;
      if (type === 'all') {
        // Reset to show all notifications
        return;
      }
      state.notifications = state.notifications.filter(notification => notification.type === type);
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(notif => !notif.isRead).length;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Mark notification as read
    builder
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        const notification = state.notifications.find(notif => notif.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.error = null;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setLoading, 
  addNotification, 
  updateNotification, 
  markAllAsRead, 
  filterNotificationsByType, 
  clearNotifications 
} = notificationSlice.actions;
export default notificationSlice.reducer;
