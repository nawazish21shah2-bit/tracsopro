// Location and Tracking Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Location, LocationState, TrackingData, Coordinates } from '../../types';
import apiService from '../../services/api';

// Initial state
const initialState: LocationState = {
  locations: [],
  currentLocation: null,
  trackingData: [],
  isTracking: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchLocations = createAsyncThunk(
  'locations/fetchLocations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getLocations();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch locations');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch locations');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'locations/updateLocation',
  async (locationData: Partial<Location>, { rejectWithValue }) => {
    try {
      const response = await apiService.updateLocation(locationData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update location');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update location');
    }
  }
);

export const sendLocationUpdate = createAsyncThunk(
  'locations/sendLocationUpdate',
  async (trackingData: {
    guardId: string;
    coordinates: Coordinates;
    accuracy: number;
    batteryLevel: number;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.sendLocationUpdate(trackingData);
      if (response.success) {
        return trackingData;
      } else {
        return rejectWithValue(response.message || 'Failed to update location');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update location');
    }
  }
);

export const fetchTrackingHistory = createAsyncThunk(
  'locations/fetchTrackingHistory',
  async (params: { guardId: string; startDate?: Date; endDate?: Date }, { rejectWithValue }) => {
    try {
      const response = await apiService.getTrackingHistory(params.guardId, params.startDate, params.endDate);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to fetch tracking history');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tracking history');
    }
  }
);

export const recordLocationData = createAsyncThunk(
  'locations/recordLocationData',
  async (locationData: {
    guardId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    batteryLevel?: number;
    timestamp: number;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.recordLocation(locationData.guardId, locationData);
      if (response.success) {
        return { ...locationData, id: response.data.id };
      } else {
        return rejectWithValue(response.message || 'Failed to record location');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to record location');
    }
  }
);

export const recordGeofenceEvent = createAsyncThunk(
  'locations/recordGeofenceEvent',
  async (eventData: {
    guardId: string;
    geofenceId: string;
    eventType: 'ENTER' | 'EXIT';
    location: {
      latitude: number;
      longitude: number;
      accuracy: number;
      timestamp: number;
    };
    timestamp: number;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.recordGeofenceEvent(eventData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to record geofence event');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to record geofence event');
    }
  }
);

export const getLiveLocations = createAsyncThunk(
  'locations/getLiveLocations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getLiveLocations();
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to get live locations');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get live locations');
    }
  }
);

// Location slice
const locationSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentLocation: (state, action: PayloadAction<Location | null>) => {
      state.currentLocation = action.payload;
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
    addTrackingData: (state, action: PayloadAction<TrackingData>) => {
      state.trackingData.push(action.payload);
      // Keep only last 100 tracking points to prevent memory issues
      if (state.trackingData.length > 100) {
        state.trackingData = state.trackingData.slice(-100);
      }
    },
    updateTrackingData: (state, action: PayloadAction<{ id: string; data: Partial<TrackingData> }>) => {
      const { id, data } = action.payload;
      const index = state.trackingData.findIndex(item => item.id === id);
      if (index !== -1) {
        state.trackingData[index] = { ...state.trackingData[index], ...data };
      }
    },
    clearTrackingData: (state) => {
      state.trackingData = [];
    },
    clearLocations: (state) => {
      state.locations = [];
      state.currentLocation = null;
      state.trackingData = [];
      state.isTracking = false;
      state.error = null;
    },
    setGeofenceEvent: (state, action: PayloadAction<{
      guardId: string;
      geofenceId: string;
      eventType: 'ENTER' | 'EXIT';
      timestamp: number;
    }>) => {
      // Handle geofence events in the UI
      const event = action.payload;
      // Could trigger notifications or UI updates here
    },
    updateLiveLocations: (state, action: PayloadAction<any[]>) => {
      // Update live locations from WebSocket
      state.trackingData = action.payload.map((location, index) => ({
        id: location.guard?.id || index.toString(),
        guardId: location.guard?.id || '',
        coordinates: {
          latitude: location.location?.latitude || 0,
          longitude: location.location?.longitude || 0,
        },
        timestamp: new Date(location.lastUpdate || Date.now()),
        batteryLevel: location.location?.batteryLevel || 0,
        isOnline: true,
        accuracy: location.location?.accuracy || 0,
      }));
    },
  },
  extraReducers: (builder) => {
    // Fetch locations
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.locations = action.payload;
        state.error = null;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update location
    builder
      .addCase(updateLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.locations.findIndex(location => location.id === action.payload.id);
        if (index !== -1) {
          state.locations[index] = action.payload;
        }
        if (state.currentLocation?.id === action.payload.id) {
          state.currentLocation = action.payload;
        }
        state.error = null;
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send location update
    builder
      .addCase(sendLocationUpdate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendLocationUpdate.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add to tracking data
        const trackingData: TrackingData = {
          id: Date.now().toString(),
          guardId: action.payload.guardId,
          coordinates: action.payload.coordinates,
          timestamp: new Date(),
          batteryLevel: action.payload.batteryLevel,
          isOnline: true,
          accuracy: action.payload.accuracy,
        };
        state.trackingData.push(trackingData);
        state.error = null;
      })
      .addCase(sendLocationUpdate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch tracking history
    builder
      .addCase(fetchTrackingHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrackingHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trackingData = action.payload;
        state.error = null;
      })
      .addCase(fetchTrackingHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Record location data
    builder
      .addCase(recordLocationData.pending, (state) => {
        state.error = null;
      })
      .addCase(recordLocationData.fulfilled, (state, action) => {
        // Add recorded location to tracking data
        const trackingData: TrackingData = {
          id: action.payload.id || Date.now().toString(),
          guardId: action.payload.guardId,
          coordinates: {
            latitude: action.payload.latitude,
            longitude: action.payload.longitude,
          },
          timestamp: new Date(action.payload.timestamp),
          batteryLevel: action.payload.batteryLevel || 0,
          isOnline: true,
          accuracy: action.payload.accuracy,
        };
        state.trackingData.push(trackingData);
        // Keep only last 100 tracking points
        if (state.trackingData.length > 100) {
          state.trackingData = state.trackingData.slice(-100);
        }
        state.error = null;
      })
      .addCase(recordLocationData.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Record geofence event
    builder
      .addCase(recordGeofenceEvent.pending, (state) => {
        state.error = null;
      })
      .addCase(recordGeofenceEvent.fulfilled, (state, action) => {
        // Geofence event recorded successfully
        state.error = null;
      })
      .addCase(recordGeofenceEvent.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Get live locations
    builder
      .addCase(getLiveLocations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getLiveLocations.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update tracking data with live locations
        state.trackingData = action.payload.map((location: any, index: number) => ({
          id: location.guard?.id || index.toString(),
          guardId: location.guard?.id || '',
          coordinates: {
            latitude: location.location?.latitude || 0,
            longitude: location.location?.longitude || 0,
          },
          timestamp: new Date(location.lastUpdate || Date.now()),
          batteryLevel: location.location?.batteryLevel || 0,
          isOnline: true,
          accuracy: location.location?.accuracy || 0,
        }));
        state.error = null;
      })
      .addCase(getLiveLocations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setLoading, 
  setCurrentLocation, 
  setTracking, 
  addTrackingData, 
  updateTrackingData, 
  clearTrackingData, 
  clearLocations,
  setGeofenceEvent,
  updateLiveLocations
} = locationSlice.actions;
export default locationSlice.reducer;
