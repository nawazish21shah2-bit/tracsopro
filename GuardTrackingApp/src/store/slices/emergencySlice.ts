import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { emergencyApi } from '../../services/api/emergencyApi';

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
  responderName?: string;
}

export interface EmergencyState {
  alerts: EmergencyAlert[];
  activeAlerts: EmergencyAlert[];
  guardActiveAlert: EmergencyAlert | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  lastRealtimeUpdate: EmergencyStatusUpdate | null;
  statistics: {
    totalAlerts: number;
    activeAlerts: number;
    criticalAlerts: number;
    resolvedToday: number;
  } | null;
}

export interface EmergencyStatusUpdate {
  alertId: string;
  guardId?: string;
  guardName?: string;
  siteName?: string;
  action: 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_ALARM';
  actorUserId?: string;
  actorName?: string;
  actorRole?: string;
  actorRoleLabel?: string;
  resolution?: string;
  timestamp: string;
}

const initialState: EmergencyState = {
  alerts: [],
  activeAlerts: [],
  guardActiveAlert: null,
  loading: false,
  submitting: false,
  error: null,
  lastRealtimeUpdate: null,
  statistics: null,
};

// Async thunks
export const triggerEmergencyAlert = createAsyncThunk(
  'emergency/triggerAlert',
  async (
    alertData: {
      type: EmergencyAlert['type'];
      severity: EmergencyAlert['severity'];
      location: EmergencyAlert['location'];
      message?: string;
      shiftId?: string;
    },
    { signal },
  ) => {
    const response = await emergencyApi.triggerEmergencyAlert(alertData, { signal, retries: 1 });

    if (!response.success) {
      if (
        (response.code === 'ACTIVE_ALERT_EXISTS' || response.code === 'EMERGENCY_COOLDOWN') &&
        response.data
      ) {
        return {
          ...response.data,
          duplicate: true,
          notice: response.message,
        };
      }
      throw new Error(response.message || 'Failed to trigger emergency alert');
    }

    return {
      ...response.data,
      duplicate: false,
    };
  }
);

export const fetchGuardActiveEmergencyAlert = createAsyncThunk(
  'emergency/fetchGuardActiveAlert',
  async () => {
    const response = await emergencyApi.getMyActiveEmergencyAlert();

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch active emergency alert');
    }

    return response.data;
  }
);

export const acknowledgeEmergencyAlert = createAsyncThunk(
  'emergency/acknowledgeAlert',
  async (alertId: string) => {
    const response = await emergencyApi.acknowledgeEmergencyAlert(alertId);

    if (!response.success) {
      throw new Error(response.message || 'Failed to acknowledge emergency alert');
    }

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
    applyEmergencyStatusUpdate: (state, action: PayloadAction<EmergencyStatusUpdate>) => {
      state.lastRealtimeUpdate = action.payload;
      const { alertId, action: statusAction, actorName } = action.payload;

      if (state.guardActiveAlert?.id === alertId) {
        if (statusAction === 'ACKNOWLEDGED') {
          state.guardActiveAlert = {
            ...state.guardActiveAlert,
            status: 'ACKNOWLEDGED',
            acknowledgedAt: action.payload.timestamp,
            responderName: actorName,
          };
        } else {
          state.guardActiveAlert = null;
        }
      }

      if (statusAction === 'ACKNOWLEDGED') {
        const activeIndex = state.activeAlerts.findIndex(alert => alert.id === alertId);
        if (activeIndex !== -1) {
          state.activeAlerts[activeIndex] = {
            ...state.activeAlerts[activeIndex],
            status: 'ACKNOWLEDGED',
            acknowledgedAt: action.payload.timestamp,
            responderName: actorName,
          };
        }
      } else {
        state.activeAlerts = state.activeAlerts.filter(alert => alert.id !== alertId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Trigger Emergency Alert
      .addCase(triggerEmergencyAlert.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(triggerEmergencyAlert.fulfilled, (state, action) => {
        state.submitting = false;
        const { duplicate, notice, ...alert } = action.payload as EmergencyAlert & {
          duplicate?: boolean;
          notice?: string;
        };

        if (!duplicate) {
          state.alerts.unshift(alert);
          state.activeAlerts.unshift(alert);
        }

        state.guardActiveAlert = alert;
        state.error = duplicate ? notice || null : null;
      })
      .addCase(triggerEmergencyAlert.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message || 'Failed to trigger emergency alert';
      })

      // Guard active emergency alert
      .addCase(fetchGuardActiveEmergencyAlert.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGuardActiveEmergencyAlert.fulfilled, (state, action) => {
        state.loading = false;
        state.guardActiveAlert = action.payload;
      })
      .addCase(fetchGuardActiveEmergencyAlert.rejected, (state) => {
        state.loading = false;
        state.guardActiveAlert = null;
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

        state.activeAlerts = state.activeAlerts.filter(alert => alert.id !== alertId);
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
  applyEmergencyStatusUpdate,
} = emergencySlice.actions;

export default emergencySlice.reducer;
