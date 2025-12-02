import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Shift,
  ShiftStats,
  CheckInRequest,
  CheckOutRequest,
  ShiftStatus,
} from '../../types/shift.types';
import shiftService from '../../services/shiftService';
import { securityManager } from '../../utils/security';

interface ShiftState {
  stats: ShiftStats | null;
  todayShifts: Shift[];
  upcomingShifts: Shift[];
  pastShifts: Shift[];
  weeklyShifts: Shift[];
  activeShift: Shift | null;
  nextShift: Shift | null;
  currentShift: Shift | null;
  loading: boolean;
  error: string | null;
  checkInLoading: boolean;
  checkOutLoading: boolean;
  // Phase 3: Enhanced loading states
  statisticsLoading: boolean;
  breakLoading: boolean;
  incidentLoading: boolean;
  createShiftLoading: boolean;
  refreshing: boolean;
  syncLoading: boolean;
  // Phase 3: Enhanced data
  currentBreak: any | null;
  incidents: any[];
  notifications: any[];
  // Phase 3: Error tracking
  lastSyncTime: string | null;
  networkStatus: 'online' | 'offline' | 'syncing';
  errorHistory: Array<{
    timestamp: string;
    error: string;
    action: string;
  }>;
}

const initialState: ShiftState = {
  stats: null,
  todayShifts: [],
  upcomingShifts: [],
  pastShifts: [],
  weeklyShifts: [],
  activeShift: null,
  nextShift: null,
  currentShift: null,
  loading: false,
  error: null,
  checkInLoading: false,
  checkOutLoading: false,
  // Phase 3: Enhanced loading states
  statisticsLoading: false,
  breakLoading: false,
  incidentLoading: false,
  createShiftLoading: false,
  refreshing: false,
  syncLoading: false,
  // Phase 3: Enhanced data
  currentBreak: null,
  incidents: [],
  notifications: [],
  // Phase 3: Error tracking
  lastSyncTime: null,
  networkStatus: 'online',
  errorHistory: [],
};

// Async Thunks
export const fetchShiftStatistics = createAsyncThunk(
  'shift/fetchShiftStatistics',
  async (params: { startDate?: string; endDate?: string } = {}, { rejectWithValue }) => {
    try {
      return await shiftService.getShiftStatistics(params);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch statistics');
    }
  }
);

export const fetchMonthlyStats = createAsyncThunk(
  'shift/fetchMonthlyStats',
  async (_, { rejectWithValue }) => {
    try {
      return await shiftService.getMonthlyStats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch stats');
    }
  }
);

export const fetchTodayShifts = createAsyncThunk(
  'shift/fetchTodayShifts',
  async (_, { rejectWithValue }) => {
    try {
      return await shiftService.getTodayShifts();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch today shifts');
    }
  }
);

export const fetchUpcomingShifts = createAsyncThunk(
  'shift/fetchUpcomingShifts',
  async (_, { rejectWithValue }) => {
    try {
      return await shiftService.getUpcomingShifts();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch upcoming shifts');
    }
  }
);

export const fetchPastShifts = createAsyncThunk(
  'shift/fetchPastShifts',
  async (limit: number = 20, { rejectWithValue }) => {
    try {
      return await shiftService.getPastShifts(limit);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch past shifts');
    }
  }
);

export const fetchWeeklyShiftSummary = createAsyncThunk(
  'shift/fetchWeeklyShiftSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await shiftService.getWeeklyShiftSummary();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch weekly summary');
    }
  }
);

export const fetchActiveShift = createAsyncThunk(
  'shift/fetchActiveShift',
  async (_, { rejectWithValue }) => {
    try {
      const hasValidTokens = await securityManager.areTokensValid();
      if (!hasValidTokens) {
        return rejectWithValue('Not authenticated');
      }
      // getActiveShift returns null if no active shift (404), which is valid
      const activeShift = await shiftService.getActiveShift();
      return activeShift; // Can be null, which is fine
    } catch (error: any) {
      // Only reject for actual errors, not 404s (which return null)
      if (error.response?.status === 404) {
        return null; // No active shift is not an error
      }
      return rejectWithValue(error.response?.data?.error || error.message || 'Failed to fetch active shift');
    }
  }
);

export const fetchNextUpcomingShift = createAsyncThunk(
  'shift/fetchNextUpcomingShift',
  async (_, { rejectWithValue }) => {
    try {
      return await shiftService.getNextUpcomingShift();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch next shift');
    }
  }
);

export const checkInToShift = createAsyncThunk(
  'shift/checkIn',
  async (data: CheckInRequest, { rejectWithValue }) => {
    try {
      const response = await shiftService.checkIn(data);
      return response.shift;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check in');
    }
  }
);

// Phase 3: Enhanced async thunks
export const syncAllData = createAsyncThunk(
  'shift/syncAllData',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const results = await Promise.allSettled([
        dispatch(fetchActiveShift()),
        dispatch(fetchUpcomingShifts()),
        dispatch(fetchTodayShifts()),
        dispatch(fetchMonthlyStats()),
      ]);
      
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);
      
      if (errors.length > 0) {
        throw new Error(`Sync partially failed: ${errors.join(', ')}`);
      }
      
      return { syncTime: new Date().toISOString() };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Sync failed');
    }
  }
);

export const createIncidentReport = createAsyncThunk(
  'shift/createIncidentReport',
  async (data: { 
    shiftId: string; 
    description: string; 
    severity: 'low' | 'medium' | 'high'; 
    photos?: string[];
    location?: { latitude: number; longitude: number };
  }, { rejectWithValue }) => {
    try {
      return await shiftService.createIncidentReport(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create incident report');
    }
  }
);

export const startBreak = createAsyncThunk(
  'shift/startBreak',
  async (data: { shiftId: string; breakType: 'lunch' | 'short' | 'emergency' }, { rejectWithValue }) => {
    try {
      return await shiftService.startBreak(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to start break');
    }
  }
);

export const endBreak = createAsyncThunk(
  'shift/endBreak',
  async (breakId: string, { rejectWithValue }) => {
    try {
      return await shiftService.endBreak(breakId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to end break');
    }
  }
);

export const checkOutFromShift = createAsyncThunk(
  'shift/checkOut',
  async (data: CheckOutRequest, { rejectWithValue }) => {
    try {
      const response = await shiftService.checkOut(data);
      return response.shift;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check out');
    }
  }
);

// Phase 2: Enhanced Check-in/out with GPS
export const checkInToShiftWithLocation = createAsyncThunk(
  'shift/checkInWithLocation',
  async (data: { shiftId: string; location: { latitude: number; longitude: number; accuracy: number; address?: string } }, { rejectWithValue }) => {
    try {
      return await shiftService.checkInToShift(data.shiftId, data.location);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check in');
    }
  }
);

export const checkOutFromShiftWithLocation = createAsyncThunk(
  'shift/checkOutWithLocation',
  async (data: { shiftId: string; location: { latitude: number; longitude: number; accuracy: number; address?: string }; notes?: string }, { rejectWithValue }) => {
    try {
      return await shiftService.checkOutFromShift(data.shiftId, data.location, data.notes);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check out');
    }
  }
);

// Phase 2: Break Management
export const startShiftBreak = createAsyncThunk(
  'shift/startBreak',
  async (data: { shiftId: string; breakType: string; location?: { latitude: number; longitude: number; accuracy: number }; notes?: string }, { rejectWithValue }) => {
    try {
      return await shiftService.startBreak(data.shiftId, data.breakType, data.location, data.notes);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to start break');
    }
  }
);

export const endShiftBreak = createAsyncThunk(
  'shift/endBreak',
  async (data: { shiftId: string; breakId: string; location?: { latitude: number; longitude: number; accuracy: number }; notes?: string }, { rejectWithValue }) => {
    try {
      return await shiftService.endBreak(data.shiftId, data.breakId, data.location, data.notes);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to end break');
    }
  }
);

// Phase 2: Incident Reporting
export const reportShiftIncident = createAsyncThunk(
  'shift/reportIncident',
  async (data: { shiftId: string; incident: { incidentType: string; severity: string; title: string; description: string; location?: { latitude: number; longitude: number; accuracy: number; address?: string }; attachments?: string[] } }, { rejectWithValue }) => {
    try {
      return await shiftService.reportIncident(data.shiftId, data.incident);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to report incident');
    }
  }
);

// Phase 2: Create Shift
export const createNewShift = createAsyncThunk(
  'shift/createShift',
  async (data: { locationName: string; locationAddress: string; scheduledStartTime: string; scheduledEndTime: string; description?: string; notes?: string }, { rejectWithValue }) => {
    try {
      return await shiftService.createShift(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create shift');
    }
  }
);

export const refreshDashboardData = createAsyncThunk(
  'shift/refreshDashboard',
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchMonthlyStats()),
      dispatch(fetchTodayShifts()),
      dispatch(fetchUpcomingShifts()),
      dispatch(fetchActiveShift()),
      dispatch(fetchNextUpcomingShift()),
      dispatch(fetchWeeklyShiftSummary()),
    ]);
  }
);

const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentShift: (state, action: PayloadAction<Shift | null>) => {
      state.currentShift = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Monthly Stats
    builder
      .addCase(fetchMonthlyStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchMonthlyStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Today Shifts
    builder
      .addCase(fetchTodayShifts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayShifts.fulfilled, (state, action) => {
        state.loading = false;
        state.todayShifts = action.payload;
        state.error = null; // Clear error on successful fetch
      })
      .addCase(fetchTodayShifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Upcoming Shifts
    builder
      .addCase(fetchUpcomingShifts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingShifts.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingShifts = action.payload;
        state.error = null; // Clear error on successful fetch
      })
      .addCase(fetchUpcomingShifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Past Shifts
    builder
      .addCase(fetchPastShifts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPastShifts.fulfilled, (state, action) => {
        state.loading = false;
        state.pastShifts = action.payload;
        state.error = null; // Clear error on successful fetch
      })
      .addCase(fetchPastShifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Weekly Summary
    builder
      .addCase(fetchWeeklyShiftSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeeklyShiftSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.weeklyShifts = action.payload;
      })
      .addCase(fetchWeeklyShiftSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Active Shift
    builder
      .addCase(fetchActiveShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveShift.fulfilled, (state, action) => {
        state.loading = false;
        state.activeShift = action.payload; // Can be null, which is valid
        state.error = null; // Clear error on successful fetch (even if null)
      })
      .addCase(fetchActiveShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Next Upcoming Shift
    builder
      .addCase(fetchNextUpcomingShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNextUpcomingShift.fulfilled, (state, action) => {
        state.loading = false;
        state.nextShift = action.payload;
      })
      .addCase(fetchNextUpcomingShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Check In
    builder
      .addCase(checkInToShift.pending, (state) => {
        state.checkInLoading = true;
        state.error = null;
      })
      .addCase(checkInToShift.fulfilled, (state, action) => {
        state.checkInLoading = false;
        state.activeShift = action.payload;
        // Update shift in todayShifts array
        const index = state.todayShifts.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.todayShifts[index] = action.payload;
        }
      })
      .addCase(checkInToShift.rejected, (state, action) => {
        state.checkInLoading = false;
        state.error = action.payload as string;
      });

    // Check Out
    builder
      .addCase(checkOutFromShift.pending, (state) => {
        state.checkOutLoading = true;
        state.error = null;
      })
      .addCase(checkOutFromShift.fulfilled, (state, action) => {
        state.checkOutLoading = false;
        state.activeShift = null;
        // Update shift in todayShifts array
        const index = state.todayShifts.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.todayShifts[index] = action.payload;
        }
      })
      .addCase(checkOutFromShift.rejected, (state, action) => {
        state.checkOutLoading = false;
        state.error = action.payload as string;
      });

    // Check In With Location
    builder
      .addCase(checkInToShiftWithLocation.pending, (state) => {
        state.checkInLoading = true;
        state.error = null;
      })
      .addCase(checkInToShiftWithLocation.fulfilled, (state, action) => {
        state.checkInLoading = false;
        state.activeShift = action.payload;
        // Update shift in todayShifts array
        const index = state.todayShifts.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.todayShifts[index] = action.payload;
        }
      })
      .addCase(checkInToShiftWithLocation.rejected, (state, action) => {
        state.checkInLoading = false;
        state.error = action.payload as string;
      });

    // Check Out With Location
    builder
      .addCase(checkOutFromShiftWithLocation.pending, (state) => {
        state.checkOutLoading = true;
        state.error = null;
      })
      .addCase(checkOutFromShiftWithLocation.fulfilled, (state, action) => {
        state.checkOutLoading = false;
        state.activeShift = null;
        // Update shift in todayShifts array
        const index = state.todayShifts.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.todayShifts[index] = action.payload;
        }
      })
      .addCase(checkOutFromShiftWithLocation.rejected, (state, action) => {
        state.checkOutLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Shift Statistics
    builder
      .addCase(fetchShiftStatistics.pending, (state) => {
        state.statisticsLoading = true;
        state.error = null;
      })
      .addCase(fetchShiftStatistics.fulfilled, (state, action) => {
        state.statisticsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchShiftStatistics.rejected, (state, action) => {
        state.statisticsLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentShift } = shiftSlice.actions;
export default shiftSlice.reducer;
