import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ShiftReport,
  CreateShiftReportRequest,
  UpdateShiftReportRequest,
  ReportType,
} from '../../types/shift.types';
import shiftReportService from '../../services/shiftReportService';

interface ShiftReportState {
  reports: ShiftReport[];
  currentReport: ShiftReport | null;
  loading: boolean;
  error: string | null;
  submitLoading: boolean;
}

const initialState: ShiftReportState = {
  reports: [],
  currentReport: null,
  loading: false,
  error: null,
  submitLoading: false,
};

// Async Thunks
export const fetchGuardReports = createAsyncThunk(
  'shiftReport/fetchGuardReports',
  async (limit: number = 50, { rejectWithValue }) => {
    try {
      return await shiftReportService.getGuardReports(limit);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch reports');
    }
  }
);

export const fetchShiftReports = createAsyncThunk(
  'shiftReport/fetchShiftReports',
  async (shiftId: string, { rejectWithValue }) => {
    try {
      return await shiftReportService.getShiftReports(shiftId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch shift reports');
    }
  }
);

export const createReport = createAsyncThunk(
  'shiftReport/createReport',
  async (data: CreateShiftReportRequest, { rejectWithValue }) => {
    try {
      const response = await shiftReportService.createShiftReport(data);
      return response.report;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create report');
    }
  }
);

export const updateReport = createAsyncThunk(
  'shiftReport/updateReport',
  async (
    { reportId, data }: { reportId: string; data: UpdateShiftReportRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await shiftReportService.updateShiftReport(reportId, data);
      return response.report;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update report');
    }
  }
);

export const deleteReport = createAsyncThunk(
  'shiftReport/deleteReport',
  async (reportId: string, { rejectWithValue }) => {
    try {
      await shiftReportService.deleteShiftReport(reportId);
      return reportId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete report');
    }
  }
);

const shiftReportSlice = createSlice({
  name: 'shiftReport',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentReport: (state, action: PayloadAction<ShiftReport | null>) => {
      state.currentReport = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Guard Reports
    builder
      .addCase(fetchGuardReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuardReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchGuardReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Shift Reports
    builder
      .addCase(fetchShiftReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShiftReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchShiftReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create Report
    builder
      .addCase(createReport.pending, (state) => {
        state.submitLoading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.reports.unshift(action.payload);
      })
      .addCase(createReport.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload as string;
      });

    // Update Report
    builder
      .addCase(updateReport.pending, (state) => {
        state.submitLoading = true;
        state.error = null;
      })
      .addCase(updateReport.fulfilled, (state, action) => {
        state.submitLoading = false;
        const index = state.reports.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.reports[index] = action.payload;
        }
      })
      .addCase(updateReport.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload as string;
      });

    // Delete Report
    builder
      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = state.reports.filter(r => r.id !== action.payload);
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentReport } = shiftReportSlice.actions;
export default shiftReportSlice.reducer;
