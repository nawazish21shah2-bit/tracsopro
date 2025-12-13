import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { clientApi } from '../api/clientApi';

// Types
export interface DashboardStats {
  guardsOnDuty: number;
  missedShifts: number;
  activeSites: number;
  newReports: number;
}

export interface GuardData {
  id: string;
  name: string;
  avatar?: string;
  site?: string;
  siteAddress?: string;
  siteLatitude?: number;
  siteLongitude?: number;
  guardLatitude?: number;
  guardLongitude?: number;
  shiftTime?: string;
  status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
  checkInTime?: string;
  checkOutTime?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  pastJobs?: number;
  rating?: number;
  availability?: string;
}

export interface ReportData {
  id: string;
  type: 'Medical Emergency' | 'Incident' | 'Violation' | 'Maintenance';
  guardName: string;
  guardAvatar?: string;
  site: string;
  time: string;
  description: string;
  status: 'Respond' | 'New' | 'Reviewed';
  checkInTime?: string;
}

export interface SiteData {
  id: string;
  name: string;
  address: string;
  guardName: string;
  guardAvatar?: string;
  status: 'Active' | 'Upcoming' | 'Missed';
  shiftTime?: string;
  checkInTime?: string;
}

export interface NotificationData {
  id: string;
  guardName: string;
  guardAvatar?: string;
  action: string;
  site: string;
  time?: string;
  status: 'Active';
}

export interface ClientState {
  // Dashboard
  dashboardStats: DashboardStats | null;
  
  // Guards
  guards: GuardData[];
  guardsLoading: boolean;
  guardsError: string | null;
  
  // Reports
  reports: ReportData[];
  reportsLoading: boolean;
  reportsError: string | null;
  
  // Sites
  sites: SiteData[];
  sitesLoading: boolean;
  sitesError: string | null;
  
  // Notifications
  notifications: NotificationData[];
  notificationsLoading: boolean;
  notificationsError: string | null;
  
  // General loading states
  loading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  dashboardStats: null,
  guards: [],
  guardsLoading: false,
  guardsError: null,
  reports: [],
  reportsLoading: false,
  reportsError: null,
  sites: [],
  sitesLoading: false,
  sitesError: null,
  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchDashboardStats = createAsyncThunk(
  'client/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await clientApi.getDashboardStats();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchMyGuards = createAsyncThunk(
  'client/fetchMyGuards',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await clientApi.getMyGuards(params.page, params.limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch guards');
    }
  }
);

export const fetchMyReports = createAsyncThunk(
  'client/fetchMyReports',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await clientApi.getMyReports(params.page, params.limit);
      // Ensure we return a valid structure even if data is null/undefined
      if (!response.success || !response.data) {
        return rejectWithValue(response.message || 'Failed to fetch reports');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
);

export const fetchMySites = createAsyncThunk(
  'client/fetchMySites',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await clientApi.getMySites(params.page, params.limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sites');
    }
  }
);

export const fetchMyNotifications = createAsyncThunk(
  'client/fetchMyNotifications',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await clientApi.getMyNotifications(params.page, params.limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// Slice
const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.guardsError = null;
      state.reportsError = null;
      state.sitesError = null;
      state.notificationsError = null;
    },
    resetClientState: () => initialState,
  },
  extraReducers: (builder) => {
    // Dashboard Stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload || {
          guardsOnDuty: 0,
          missedShifts: 0,
          activeSites: 0,
          newReports: 0,
        };
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Set default stats on error so UI doesn't get stuck
        if (!state.dashboardStats) {
          state.dashboardStats = {
            guardsOnDuty: 0,
            missedShifts: 0,
            activeSites: 0,
            newReports: 0,
          };
        }
      });

    // Guards
    builder
      .addCase(fetchMyGuards.pending, (state) => {
        state.guardsLoading = true;
        state.guardsError = null;
      })
      .addCase(fetchMyGuards.fulfilled, (state, action) => {
        state.guardsLoading = false;
        // Safely handle null/undefined payload
        state.guards = action.payload?.guards || action.payload || [];
      })
      .addCase(fetchMyGuards.rejected, (state, action) => {
        state.guardsLoading = false;
        state.guardsError = action.payload as string;
        // Ensure guards array exists even on error
        if (!state.guards) {
          state.guards = [];
        }
      });

    // Reports
    builder
      .addCase(fetchMyReports.pending, (state) => {
        state.reportsLoading = true;
        state.reportsError = null;
      })
      .addCase(fetchMyReports.fulfilled, (state, action) => {
        state.reportsLoading = false;
        // Safely handle null/undefined payload
        state.reports = action.payload?.reports || [];
      })
      .addCase(fetchMyReports.rejected, (state, action) => {
        state.reportsLoading = false;
        state.reportsError = action.payload as string;
      });

    // Sites
    builder
      .addCase(fetchMySites.pending, (state) => {
        state.sitesLoading = true;
        state.sitesError = null;
      })
      .addCase(fetchMySites.fulfilled, (state, action) => {
        state.sitesLoading = false;
        // Safely handle null/undefined payload
        state.sites = action.payload?.sites || [];
      })
      .addCase(fetchMySites.rejected, (state, action) => {
        state.sitesLoading = false;
        state.sitesError = action.payload as string;
      });

    // Notifications
    builder
      .addCase(fetchMyNotifications.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError = null;
      })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.notificationsLoading = false;
        // Safely handle null/undefined payload
        state.notifications = action.payload?.notifications || [];
      })
      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.notificationsError = action.payload as string;
      });
  },
});

export const { clearError, resetClientState } = clientSlice.actions;
export default clientSlice.reducer;
