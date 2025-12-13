// Integration Tests - Shift Management Flow
// Tests the complete shift flow: check-in -> tracking -> check-out

import { configureStore } from '@reduxjs/toolkit';
import shiftReducer from '../../store/slices/shiftSlice';
import locationReducer from '../../store/slices/locationSlice';
import {
  fetchActiveShift,
  checkInToShift,
  checkOutFromShift,
} from '../../store/slices/shiftSlice';
import { setCurrentLocation, setTracking } from '../../store/slices/locationSlice';
import shiftService from '../../services/shiftService';

// Mock services
jest.mock('../../services/shiftService');
jest.mock('../../services/LocationService');
jest.mock('react-native-geolocation-service');

describe('Shift Management Flow Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({
      reducer: {
        shifts: shiftReducer,
        locations: locationReducer,
      },
    });
  });

  describe('Complete Shift Flow', () => {
    it('should complete full shift flow: fetch -> check-in -> track -> check-out', async () => {
      const mockShift = {
        id: '1',
        guardId: 'guard-123',
        locationName: 'Main Building',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'SCHEDULED',
      };

      const mockActiveShift = {
        ...mockShift,
        status: 'IN_PROGRESS',
        actualStartTime: new Date().toISOString(),
      };

      const mockCompletedShift = {
        ...mockActiveShift,
        status: 'COMPLETED',
        actualEndTime: new Date().toISOString(),
      };

      // Step 1: Fetch active shift
      (shiftService.getActiveShift as jest.Mock).mockResolvedValue(mockShift);
      const fetchResult = await store.dispatch(fetchActiveShift());
      expect(fetchActiveShift.fulfilled.match(fetchResult)).toBe(true);

      // Step 2: Check in
      (shiftService.checkIn as jest.Mock).mockResolvedValue({
        message: 'Checked in successfully',
        shift: mockActiveShift,
      });

      const checkInResult = await store.dispatch(
        checkInToShift({
          shiftId: '1',
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        })
      );

      expect(checkInToShift.fulfilled.match(checkInResult)).toBe(true);

      // Verify state after check-in
      let state = store.getState();
      expect(state.shifts.activeShift?.status).toBe('IN_PROGRESS');

      // Step 3: Enable location tracking
      store.dispatch(
        setCurrentLocation({
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        })
      );
      store.dispatch(setTracking(true));

      state = store.getState();
      expect(state.locations.isTracking).toBe(true);
      expect(state.locations.currentLocation).toBeDefined();

      // Step 4: Check out
      (shiftService.checkOut as jest.Mock).mockResolvedValue({
        message: 'Checked out successfully',
        shift: mockCompletedShift,
      });

      const checkOutResult = await store.dispatch(
        checkOutFromShift({
          shiftId: '1',
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        })
      );

      expect(checkOutFromShift.fulfilled.match(checkOutResult)).toBe(true);

      // Verify state after check-out
      state = store.getState();
      expect(state.shifts.activeShift).toBeNull(); // Active shift cleared after check-out
      // Note: Location tracking state is managed separately
    });

    it('should handle check-in failure when shift not found', async () => {
      (shiftService.checkIn as jest.Mock).mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'Shift not found' },
        },
      });

      const result = await store.dispatch(
        checkInToShift({
          shiftId: '999',
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        })
      );

      expect(checkInToShift.rejected.match(result)).toBe(true);

      const state = store.getState();
      expect(state.shifts.error).toBeDefined();
      expect(state.shifts.activeShift).toBeNull();
    });
  });
});

