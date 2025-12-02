import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/api';

// Types
export interface DashboardMetrics {
  totalGuards: number;
  activeGuards: number;
  totalSites: number;
  activeSites: number;
  todayIncidents: number;
  pendingIncidents: number;
  emergencyAlerts: number;
  scheduledShifts: number;
  revenue: number;
  clientSatisfaction: number;
}

export interface RecentActivity {
  id: string;
  text: string;
  time: string;
  icon: string;
  iconColor: string;
}

export interface AdminState {
  // Dashboard
  dashboardMetrics: DashboardMetrics | null;
  dashboardLoading: boolean;
  dashboardError: string | null;

  // Recent Activity
  recentActivity: RecentActivity[];
  activityLoading: boolean;
  activityError: string | null;

  // General loading states
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  dashboardMetrics: null,
  dashboardLoading: false,
  dashboardError: null,
  recentActivity: [],
  activityLoading: false,
  activityError: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getAdminDashboardStats();
      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch dashboard statistics');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch dashboard statistics';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'admin/fetchRecentActivity',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      const response = await apiService.getAdminRecentActivity(limit);
      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch recent activity');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch recent activity';
      return rejectWithValue(errorMessage);
    }
  }
);

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.dashboardError = null;
      state.activityError = null;
    },
    resetAdminState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Dashboard Stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardMetrics = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload as string;
      });

    // Fetch Recent Activity
    builder
      .addCase(fetchRecentActivity.pending, (state) => {
        state.activityLoading = true;
        state.activityError = null;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.activityLoading = false;
        state.recentActivity = action.payload;
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.activityLoading = false;
        state.activityError = action.payload as string;
      });
  },
});

export const { clearError, resetAdminState } = adminSlice.actions;
export default adminSlice.reducer;

