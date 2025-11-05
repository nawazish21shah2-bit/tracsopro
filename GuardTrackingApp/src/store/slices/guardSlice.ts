// Guard Management Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Guard, GuardState, GuardForm, GuardStatus } from '../../types';
import apiService from '../../services/api';

// Initial state
const initialState: GuardState = {
  guards: [],
  currentGuard: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchGuards = createAsyncThunk(
  'guards/fetchGuards',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getGuards(params.page, params.limit);
      if (response.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch guards');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch guards');
    }
  }
);

export const fetchGuardById = createAsyncThunk(
  'guards/fetchGuardById',
  async (guardId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getGuard(guardId);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch guard');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch guard');
    }
  }
);

export const createGuard = createAsyncThunk(
  'guards/createGuard',
  async (guardData: GuardForm, { rejectWithValue }) => {
    try {
      const response = await apiService.createGuard(guardData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create guard');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create guard');
    }
  }
);

export const updateGuard = createAsyncThunk(
  'guards/updateGuard',
  async ({ id, guardData }: { id: string; guardData: Partial<GuardForm> }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateGuard(id, guardData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update guard');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update guard');
    }
  }
);

export const deleteGuard = createAsyncThunk(
  'guards/deleteGuard',
  async (guardId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.deleteGuard(guardId);
      if (response.success) {
        return guardId;
      } else {
        return rejectWithValue(response.message || 'Failed to delete guard');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete guard');
    }
  }
);

// Guard slice
const guardSlice = createSlice({
  name: 'guards',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentGuard: (state, action: PayloadAction<Guard | null>) => {
      state.currentGuard = action.payload;
    },
    updateGuardStatus: (state, action: PayloadAction<{ guardId: string; status: GuardStatus }>) => {
      const { guardId, status } = action.payload;
      const guard = state.guards.find(g => g.id === guardId);
      if (guard) {
        guard.status = status;
      }
      if (state.currentGuard?.id === guardId) {
        state.currentGuard.status = status;
      }
    },
    clearGuards: (state) => {
      state.guards = [];
      state.currentGuard = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch guards
    builder
      .addCase(fetchGuards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGuards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.guards = action.payload;
        state.error = null;
      })
      .addCase(fetchGuards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch guard by ID
    builder
      .addCase(fetchGuardById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGuardById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentGuard = action.payload;
        state.error = null;
      })
      .addCase(fetchGuardById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create guard
    builder
      .addCase(createGuard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createGuard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.guards.push(action.payload);
        state.error = null;
      })
      .addCase(createGuard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update guard
    builder
      .addCase(updateGuard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateGuard.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.guards.findIndex(guard => guard.id === action.payload.id);
        if (index !== -1) {
          state.guards[index] = action.payload;
        }
        if (state.currentGuard?.id === action.payload.id) {
          state.currentGuard = action.payload;
        }
        state.error = null;
      })
      .addCase(updateGuard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete guard
    builder
      .addCase(deleteGuard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteGuard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.guards = state.guards.filter(guard => guard.id !== action.payload);
        if (state.currentGuard?.id === action.payload) {
          state.currentGuard = null;
        }
        state.error = null;
      })
      .addCase(deleteGuard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setLoading, 
  setCurrentGuard, 
  updateGuardStatus, 
  clearGuards 
} = guardSlice.actions;
export default guardSlice.reducer;
