import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface EmergencyAlert {
  id: string;
  guardId: string;
  type: 'PANIC' | 'MEDICAL' | 'SECURITY' | 'FIRE' | 'CUSTOM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  message?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_ALARM';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

export interface EmergencyState {
  alerts: EmergencyAlert[];
  activeAlerts: EmergencyAlert[];
  loading: boolean;
  error: string | null;
  statistics: {
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    resolvedToday: number;
  } | null;
}

const initialState: EmergencyState = {
  alerts: [],
  activeAlerts: [],
  loading: false,
  error: null,
  statistics: null,
};

// Async thunks
export const triggerEmergencyAlert = createAsyncThunk(
  'emergency/triggerAlert',
  async (alertData: {
    type: EmergencyAlert['type'];
    severity: EmergencyAlert['severity'];
    location: EmergencyAlert['location'];
    message?: string;
    shiftId?: string; // Optional: pass current shift ID for site-specific notifications
  }) => {
    const response = await api.triggerEmergencyAlert(alertData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to trigger emergency alert');
    }
    
    return response.data;
  }
);

export const acknowledgeEmergencyAlert = createAsyncThunk(
  'emergency/acknowledgeAlert',
  async (alertId: string) => {
    // Mock implementation
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return { alertId, acknowledgedAt: new Date().toISOString() };
  }
);

export const resolveEmergencyAlert = createAsyncThunk(
  'emergency/resolveAlert',
  async ({ alertId, resolution, status = 'RESOLVED' }: {
    alertId: string;
    resolution: string;
    status?: 'RESOLVED' | 'FALSE_ALARM';
  }) => {
    // Mock implementation
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return { alertId, resolvedAt: new Date().toISOString(), status };
  }
);

export const fetchActiveEmergencyAlerts = createAsyncThunk(
  'emergency/fetchActiveAlerts',
  async () => {
    // Mock implementation
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return [];
  }
);

export const fetchGuardEmergencyHistory = createAsyncThunk(
  'emergency/fetchGuardHistory',
  async ({ guardId, limit = 50 }: { guardId: string; limit?: number }) => {
    // Mock implementation
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return [];
  }
);

export const fetchEmergencyStatistics = createAsyncThunk(
  'emergency/fetchStatistics',
  async () => {
    // Mock implementation
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return {
      totalAlerts: 0,
      activeAlerts: 0,
      criticalAlerts: 0,
      resolvedToday: 0,
    };
  }
);

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addEmergencyAlert: (state, action: PayloadAction<EmergencyAlert>) => {
      state.alerts.unshift(action.payload);
      if (action.payload.status === 'ACTIVE') {
        state.activeAlerts.unshift(action.payload);
      }
    },
    updateEmergencyAlert: (state, action: PayloadAction<Partial<EmergencyAlert> & { id: string }>) => {
      const index = state.alerts.findIndex(alert => alert.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = { ...state.alerts[index], ...action.payload };
      }
      
      const activeIndex = state.activeAlerts.findIndex(alert => alert.id === action.payload.id);
      if (activeIndex !== -1) {
        if (action.payload.status && ['RESOLVED', 'FALSE_ALARM'].includes(action.payload.status)) {
          state.activeAlerts.splice(activeIndex, 1);
        } else {
          state.activeAlerts[activeIndex] = { ...state.activeAlerts[activeIndex], ...action.payload };
        }
      }
    },
    removeEmergencyAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
      state.activeAlerts = state.activeAlerts.filter(alert => alert.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Trigger Emergency Alert
      .addCase(triggerEmergencyAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerEmergencyAlert.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts.unshift(action.payload);
        state.activeAlerts.unshift(action.payload);
      })
      .addCase(triggerEmergencyAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to trigger emergency alert';
      })

      // Acknowledge Emergency Alert
      .addCase(acknowledgeEmergencyAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acknowledgeEmergencyAlert.fulfilled, (state, action) => {
        state.loading = false;
        const { alertId, acknowledgedAt } = action.payload;
        
        const alertIndex = state.alerts.findIndex(alert => alert.id === alertId);
        if (alertIndex !== -1) {
          state.alerts[alertIndex].status = 'ACKNOWLEDGED';
          state.alerts[alertIndex].acknowledgedAt = acknowledgedAt;
        }
        
        const activeIndex = state.activeAlerts.findIndex(alert => alert.id === alertId);
        if (activeIndex !== -1) {
          state.activeAlerts[activeIndex].status = 'ACKNOWLEDGED';
          state.activeAlerts[activeIndex].acknowledgedAt = acknowledgedAt;
        }
      })
      .addCase(acknowledgeEmergencyAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to acknowledge emergency alert';
      })

      // Resolve Emergency Alert
      .addCase(resolveEmergencyAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveEmergencyAlert.fulfilled, (state, action) => {
        state.loading = false;
        const { alertId, resolvedAt, status } = action.payload;
        
        const alertIndex = state.alerts.findIndex(alert => alert.id === alertId);
        if (alertIndex !== -1) {
          state.alerts[alertIndex].status = status;
          state.alerts[alertIndex].resolvedAt = resolvedAt;
        }
        
        // Remove from active alerts
        state.activeAlerts = state.activeAlerts.filter(alert => alert.id !== alertId);
      })
      .addCase(resolveEmergencyAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to resolve emergency alert';
      })

      // Fetch Active Emergency Alerts
      .addCase(fetchActiveEmergencyAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveEmergencyAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.activeAlerts = action.payload;
      })
      .addCase(fetchActiveEmergencyAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch active emergency alerts';
      })

      // Fetch Guard Emergency History
      .addCase(fetchGuardEmergencyHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuardEmergencyHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchGuardEmergencyHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch guard emergency history';
      })

      // Fetch Emergency Statistics
      .addCase(fetchEmergencyStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmergencyStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchEmergencyStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch emergency statistics';
      });
  },
});

export const {
  clearError,
  addEmergencyAlert,
  updateEmergencyAlert,
  removeEmergencyAlert,
} = emergencySlice.actions;

export default emergencySlice.reducer;
