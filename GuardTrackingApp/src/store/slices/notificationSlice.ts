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

interface FetchNotificationsOptions {
  unreadOnly?: boolean;
}

interface FetchNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
}

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (options: FetchNotificationsOptions | undefined, { rejectWithValue }) => {
    try {
      const response = await apiService.getNotifications({
        unreadOnly: options?.unreadOnly,
        page: 1,
        limit: 50,
      });
      if (response.success) {
        return {
          notifications: response.data,
          unreadCount: response.unreadCount ?? response.data.filter((n) => !n.isRead).length,
        } satisfies FetchNotificationsResult;
      }
      return rejectWithValue(response.message || 'Failed to fetch notifications');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getUnreadNotificationCount();
      if (response.success) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Failed to fetch unread count');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread count');
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
      }
      return rejectWithValue(response.message || 'Failed to mark notification as read');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsReadAsync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      if (response.success) {
        return response.data?.count ?? 0;
      }
      return rejectWithValue(response.message || 'Failed to mark all notifications as read');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.deleteNotification(notificationId);
      if (response.success) {
        return notificationId;
      }
      return rejectWithValue(response.message || 'Failed to delete notification');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAllNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.clearAllNotifications();
      if (response.success) {
        return response.data?.count ?? 0;
      }
      return rejectWithValue(response.message || 'Failed to clear notifications');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear notifications');
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
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      const exists = state.notifications.some((n) => n.id === action.payload.id);
      if (exists) return;
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
    filterNotificationsByType: (state, action: PayloadAction<NotificationType | 'all'>) => {
      const type = action.payload;
      if (type === 'all') {
        return;
      }
      state.notifications = state.notifications.filter(notification => notification.type === type);
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
        state.error = null;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(markNotificationAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(notif => notif.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.error = null;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((notification) => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload);
        if (index !== -1) {
          const wasUnread = !state.notifications[index].isRead;
          state.notifications.splice(index, 1);
          if (wasUnread) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
        state.error = null;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setLoading, 
  setUnreadCount,
  addNotification, 
  updateNotification, 
  markAllAsRead, 
  filterNotificationsByType, 
  clearNotifications 
} = notificationSlice.actions;
export default notificationSlice.reducer;
