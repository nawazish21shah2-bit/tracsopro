// Shift Slice Tests - Testing Redux state management for shifts
import shiftReducer, {
  fetchShiftStatistics,
  fetchMonthlyStats,
  fetchTodayShifts,
  fetchActiveShift,
  checkInToShift,
  checkOutFromShift,
  setCurrentShift,
  ShiftState,
} from '../shiftSlice';
import shiftService from '../../../services/shiftService';
import { Shift, ShiftStats, CheckInRequest, CheckOutRequest } from '../../../types/shift.types';

// Mock shift service
jest.mock('../../../services/shiftService');

describe('Shift Slice', () => {
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
    statisticsLoading: false,
    breakLoading: false,
    incidentLoading: false,
    createShiftLoading: false,
    refreshing: false,
    syncLoading: false,
    currentBreak: null,
    incidents: [],
    notifications: [],
    lastSyncTime: null,
    networkStatus: 'online',
    errorHistory: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state', () => {
      expect(shiftReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('fetchMonthlyStats', () => {
    it('should handle pending state', () => {
      const action = { type: fetchMonthlyStats.pending.type };
      const state = shiftReducer(initialState, action);

      expect(state.statisticsLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const mockStats: ShiftStats = {
        totalShifts: 20,
        completedShifts: 18,
        totalHours: 144,
        averageRating: 4.5,
      };

      const action = {
        type: fetchMonthlyStats.fulfilled.type,
        payload: mockStats,
      };

      const state = shiftReducer(initialState, action);

      expect(state.stats).toEqual(mockStats);
      expect(state.statisticsLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle rejected state', () => {
      const action = {
        type: fetchMonthlyStats.rejected.type,
        payload: 'Failed to fetch stats',
      };

      const state = shiftReducer(initialState, action);

      expect(state.statisticsLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch stats');
    });
  });

  describe('fetchTodayShifts', () => {
    it('should handle pending state', () => {
      const action = { type: fetchTodayShifts.pending.type };
      const state = shiftReducer(initialState, action);

      expect(state.loading).toBe(true);
    });

    it('should handle fulfilled state', () => {
      const mockShifts: Shift[] = [
        {
          id: '1',
          guardId: 'guard-123',
          locationName: 'Main Building',
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
          status: 'SCHEDULED',
        },
      ];

      const action = {
        type: fetchTodayShifts.fulfilled.type,
        payload: mockShifts,
      };

      const state = shiftReducer(initialState, action);

      expect(state.todayShifts).toEqual(mockShifts);
      expect(state.loading).toBe(false);
    });

    it('should handle rejected state', () => {
      const action = {
        type: fetchTodayShifts.rejected.type,
        payload: 'Failed to fetch today shifts',
      };

      const state = shiftReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch today shifts');
    });
  });

  describe('fetchActiveShift', () => {
    it('should handle pending state', () => {
      const action = { type: fetchActiveShift.pending.type };
      const state = shiftReducer(initialState, action);

      expect(state.loading).toBe(true);
    });

    it('should handle fulfilled state with active shift', () => {
      const mockShift: Shift = {
        id: '1',
        guardId: 'guard-123',
        locationName: 'Main Building',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'IN_PROGRESS',
        actualStartTime: new Date().toISOString(),
      };

      const action = {
        type: fetchActiveShift.fulfilled.type,
        payload: mockShift,
      };

      const state = shiftReducer(initialState, action);

      expect(state.activeShift).toEqual(mockShift);
      expect(state.currentShift).toEqual(mockShift);
      expect(state.loading).toBe(false);
    });

    it('should handle fulfilled state with null (no active shift)', () => {
      const action = {
        type: fetchActiveShift.fulfilled.type,
        payload: null,
      };

      const state = shiftReducer(initialState, action);

      expect(state.activeShift).toBeNull();
      expect(state.currentShift).toBeNull();
      expect(state.loading).toBe(false);
    });

    it('should handle rejected state', () => {
      const action = {
        type: fetchActiveShift.rejected.type,
        payload: 'Failed to fetch active shift',
      };

      const state = shiftReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch active shift');
    });
  });

  describe('checkInToShift', () => {
    it('should handle pending state', () => {
      const action = { type: checkInToShift.pending.type };
      const state = shiftReducer(initialState, action);

      expect(state.checkInLoading).toBe(true);
    });

    it('should handle fulfilled state', () => {
      const mockShift: Shift = {
        id: '1',
        guardId: 'guard-123',
        locationName: 'Main Building',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'IN_PROGRESS',
        actualStartTime: new Date().toISOString(),
      };

      const action = {
        type: checkInToShift.fulfilled.type,
        payload: mockShift, // checkInToShift returns the shift directly, not wrapped
      };

      const state = shiftReducer(initialState, action);

      expect(state.activeShift).toEqual(mockShift);
      expect(state.checkInLoading).toBe(false);
    });

    it('should handle rejected state', () => {
      const action = {
        type: checkInToShift.rejected.type,
        payload: 'Check-in failed',
      };

      const state = shiftReducer(initialState, action);

      expect(state.checkInLoading).toBe(false);
      expect(state.error).toBe('Check-in failed');
    });
  });

  describe('checkOutFromShift', () => {
    it('should handle pending state', () => {
      const action = { type: checkOutFromShift.pending.type };
      const state = shiftReducer(initialState, action);

      expect(state.checkOutLoading).toBe(true);
    });

    it('should handle fulfilled state', () => {
      const stateWithActiveShift: ShiftState = {
        ...initialState,
        activeShift: {
          id: '1',
          guardId: 'guard-123',
          locationName: 'Main Building',
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
          status: 'IN_PROGRESS',
          actualStartTime: new Date().toISOString(),
        },
      };

      const mockShift: Shift = {
        id: '1',
        guardId: 'guard-123',
        locationName: 'Main Building',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'COMPLETED',
        actualStartTime: new Date().toISOString(),
        actualEndTime: new Date().toISOString(),
      };

      const action = {
        type: checkOutFromShift.fulfilled.type,
        payload: mockShift, // checkOutFromShift returns the shift directly
      };

      const state = shiftReducer(stateWithActiveShift, action);

      expect(state.activeShift).toBeNull(); // Check-out clears active shift
      expect(state.checkOutLoading).toBe(false);
    });

    it('should handle rejected state', () => {
      const action = {
        type: checkOutFromShift.rejected.type,
        payload: 'Check-out failed',
      };

      const state = shiftReducer(initialState, action);

      expect(state.checkOutLoading).toBe(false);
      expect(state.error).toBe('Check-out failed');
    });
  });

  describe('setCurrentShift', () => {
    it('should set current shift', () => {
      const mockShift: Shift = {
        id: '1',
        guardId: 'guard-123',
        locationName: 'Main Building',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'IN_PROGRESS',
      };

      const action = setCurrentShift(mockShift);
      const state = shiftReducer(initialState, action);

      expect(state.currentShift).toEqual(mockShift);
    });
  });

  describe('setCurrentShift', () => {
    it('should clear active shift by setting to null', () => {
      const stateWithActiveShift: ShiftState = {
        ...initialState,
        activeShift: {
          id: '1',
          guardId: 'guard-123',
          locationName: 'Main Building',
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
          status: 'IN_PROGRESS',
        },
        currentShift: {
          id: '1',
          guardId: 'guard-123',
          locationName: 'Main Building',
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
          status: 'IN_PROGRESS',
        },
      };

      const action = setCurrentShift(null);
      const state = shiftReducer(stateWithActiveShift, action);

      expect(state.currentShift).toBeNull();
    });
  });
});

