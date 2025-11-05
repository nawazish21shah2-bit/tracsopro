import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Shift,
  ShiftStats,
  CheckInRequest,
  CheckOutRequest,
  ShiftStatus,
} from '../../types/shift.types';
import shiftService from '../../services/shiftService';

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
};

// Async Thunks
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
      return await shiftService.getActiveShift();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch active shift');
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
        state.activeShift = action.payload;
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
  },
});

export const { clearError, setCurrentShift } = shiftSlice.actions;
export default shiftSlice.reducer;
