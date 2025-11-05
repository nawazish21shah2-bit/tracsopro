// Incident Management Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Incident, IncidentState, IncidentForm, IncidentStatus, IncidentType, SeverityLevel } from '../../types';
import apiService from '../../services/api';

// Initial state
const initialState: IncidentState = {
  incidents: [],
  currentIncident: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchIncidents = createAsyncThunk(
  'incidents/fetchIncidents',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getIncidents(params.page, params.limit);
      if (response.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch incidents');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch incidents');
    }
  }
);

export const createIncident = createAsyncThunk(
  'incidents/createIncident',
  async (incidentData: IncidentForm, { rejectWithValue }) => {
    try {
      const response = await apiService.createIncident(incidentData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to create incident');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create incident');
    }
  }
);

export const updateIncident = createAsyncThunk(
  'incidents/updateIncident',
  async ({ id, incidentData }: { id: string; incidentData: Partial<IncidentForm> }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateIncident(id, incidentData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update incident');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update incident');
    }
  }
);

// Incident slice
const incidentSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentIncident: (state, action: PayloadAction<Incident | null>) => {
      state.currentIncident = action.payload;
    },
    updateIncidentStatus: (state, action: PayloadAction<{ incidentId: string; status: IncidentStatus }>) => {
      const { incidentId, status } = action.payload;
      const incident = state.incidents.find(i => i.id === incidentId);
      if (incident) {
        incident.status = status;
        if (status === IncidentStatus.RESOLVED || status === IncidentStatus.CLOSED) {
          incident.resolvedAt = new Date();
        }
      }
      if (state.currentIncident?.id === incidentId) {
        state.currentIncident.status = status;
        if (status === IncidentStatus.RESOLVED || status === IncidentStatus.CLOSED) {
          state.currentIncident.resolvedAt = new Date();
        }
      }
    },
    filterIncidentsByType: (state, action: PayloadAction<IncidentType>) => {
      // This would typically be handled by the API, but for local filtering:
      const type = action.payload;
      if (type === 'all') {
        // Reset to show all incidents
        return;
      }
      state.incidents = state.incidents.filter(incident => incident.type === type);
    },
    filterIncidentsBySeverity: (state, action: PayloadAction<SeverityLevel>) => {
      const severity = action.payload;
      if (severity === 'all') {
        // Reset to show all incidents
        return;
      }
      state.incidents = state.incidents.filter(incident => incident.severity === severity);
    },
    filterIncidentsByStatus: (state, action: PayloadAction<IncidentStatus>) => {
      const status = action.payload;
      if (status === 'all') {
        // Reset to show all incidents
        return;
      }
      state.incidents = state.incidents.filter(incident => incident.status === status);
    },
    clearIncidents: (state) => {
      state.incidents = [];
      state.currentIncident = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch incidents
    builder
      .addCase(fetchIncidents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incidents = action.payload;
        state.error = null;
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create incident
    builder
      .addCase(createIncident.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createIncident.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incidents.unshift(action.payload); // Add to beginning of array
        state.error = null;
      })
      .addCase(createIncident.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update incident
    builder
      .addCase(updateIncident.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateIncident.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.incidents.findIndex(incident => incident.id === action.payload.id);
        if (index !== -1) {
          state.incidents[index] = action.payload;
        }
        if (state.currentIncident?.id === action.payload.id) {
          state.currentIncident = action.payload;
        }
        state.error = null;
      })
      .addCase(updateIncident.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setLoading, 
  setCurrentIncident, 
  updateIncidentStatus, 
  filterIncidentsByType, 
  filterIncidentsBySeverity, 
  filterIncidentsByStatus, 
  clearIncidents 
} = incidentSlice.actions;
export default incidentSlice.reducer;
