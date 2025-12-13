// Location Slice Tests - Testing Redux state management for location tracking
import locationReducer, {
  setCurrentLocation,
  addTrackingData,
  clearTrackingData,
  setTracking,
  fetchLocations,
  sendLocationUpdate,
} from '../locationSlice';
import { LocationState } from '../../../types';
import apiService from '../../../services/api';

// Mock API service
jest.mock('../../../services/api');

describe('Location Slice', () => {
  const initialState: LocationState = {
    locations: [],
    currentLocation: null,
    trackingData: [],
    isTracking: false,
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state', () => {
      expect(locationReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('setCurrentLocation', () => {
    it('should set current location', () => {
      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      };

      const action = setCurrentLocation(mockLocation);
      const state = locationReducer(initialState, action);

      expect(state.currentLocation).toEqual(mockLocation);
    });

    it('should update existing location', () => {
      const firstLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      };

      const secondLocation = {
        latitude: 40.7130,
        longitude: -74.0062,
        accuracy: 12,
      };

      let state = locationReducer(initialState, setCurrentLocation(firstLocation));
      state = locationReducer(state, setCurrentLocation(secondLocation));

      expect(state.currentLocation).toEqual(secondLocation);
      expect(state.currentLocation?.latitude).toBe(40.7130);
    });
  });

  describe('addTrackingData', () => {
    it('should add tracking record to history', () => {
      const mockTrackingData = {
        id: '1',
        guardId: 'guard-123',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        accuracy: 10,
        batteryLevel: 80,
        timestamp: new Date(),
        isOnline: true,
      };

      const action = addTrackingData(mockTrackingData);
      const state = locationReducer(initialState, action);

      expect(state.trackingData).toHaveLength(1);
      expect(state.trackingData[0]).toEqual(mockTrackingData);
    });

    it('should add multiple tracking records', () => {
      const trackingData1 = {
        id: '1',
        guardId: 'guard-123',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        accuracy: 10,
        batteryLevel: 80,
        timestamp: new Date(),
        isOnline: true,
      };

      const trackingData2 = {
        id: '2',
        guardId: 'guard-123',
        coordinates: {
          latitude: 40.7130,
          longitude: -74.0062,
        },
        accuracy: 12,
        batteryLevel: 79,
        timestamp: new Date(),
        isOnline: true,
      };

      let state = locationReducer(initialState, addTrackingData(trackingData1));
      state = locationReducer(state, addTrackingData(trackingData2));

      expect(state.trackingData).toHaveLength(2);
      expect(state.trackingData[0]).toEqual(trackingData1);
      expect(state.trackingData[1]).toEqual(trackingData2);
    });
  });

  describe('clearTrackingData', () => {
    it('should clear all tracking history', () => {
      const trackingData1 = {
        id: '1',
        guardId: 'guard-123',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        accuracy: 10,
        batteryLevel: 80,
        timestamp: new Date(),
        isOnline: true,
      };

      const trackingData2 = {
        id: '2',
        guardId: 'guard-123',
        coordinates: {
          latitude: 40.7130,
          longitude: -74.0062,
        },
        accuracy: 12,
        batteryLevel: 79,
        timestamp: new Date(),
        isOnline: true,
      };

      let state = locationReducer(initialState, addTrackingData(trackingData1));
      state = locationReducer(state, addTrackingData(trackingData2));

      expect(state.trackingData).toHaveLength(2);

      const action = clearTrackingData();
      state = locationReducer(state, action);

      expect(state.trackingData).toHaveLength(0);
    });
  });

  describe('setTracking', () => {
    it('should enable tracking', () => {
      const action = setTracking(true);
      const state = locationReducer(initialState, action);

      expect(state.isTracking).toBe(true);
    });

    it('should disable tracking', () => {
      const stateWithTracking: LocationState = {
        ...initialState,
        isTracking: true,
      };

      const action = setTracking(false);
      const state = locationReducer(stateWithTracking, action);

      expect(state.isTracking).toBe(false);
    });
  });

  describe('fetchLocations', () => {
    it('should handle pending state', () => {
      const action = { type: fetchLocations.pending.type };
      const state = locationReducer(initialState, action);

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockLocations = [
        {
          id: '1',
          name: 'Main Building',
          address: '123 Main St',
          coordinates: { latitude: 40.7128, longitude: -74.0060 },
        },
      ];

      const action = {
        type: fetchLocations.fulfilled.type,
        payload: mockLocations,
      };

      const state = locationReducer(initialState, action);

      expect(state.locations).toEqual(mockLocations);
      expect(state.isLoading).toBe(false);
    });

    it('should handle rejected state', () => {
      const action = {
        type: fetchLocations.rejected.type,
        payload: 'Failed to fetch locations',
      };

      const state = locationReducer(initialState, action);

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch locations');
    });
  });
});

