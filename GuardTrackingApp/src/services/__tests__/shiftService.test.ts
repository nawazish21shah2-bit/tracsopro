// Shift Service Tests - Testing shift management, check-in/out, and shift operations
import shiftService from '../shiftService';
import axios from 'axios';
import { securityManager } from '../../utils/security';
import { Shift, CheckInRequest, CheckOutRequest } from '../../types/shift.types';

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/security');
jest.mock('../../config/apiConfig', () => ({
  getApiBaseUrl: () => 'http://localhost:3000/api',
}));

describe('ShiftService', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (securityManager.getTokens as jest.Mock).mockResolvedValue({
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
    });
    (axios.create as jest.Mock).mockResolvedValue(mockAxiosInstance);
  });

  describe('Shift Statistics', () => {
    it('should fetch monthly statistics', async () => {
      const mockStats = {
        totalShifts: 20,
        completedShifts: 18,
        totalHours: 144,
        averageRating: 4.5,
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockStats });

      const stats = await shiftService.getMonthlyStats();

      expect(stats).toEqual(mockStats);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/shifts/stats');
    });

    it('should handle statistics fetch error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect(shiftService.getMonthlyStats()).rejects.toThrow();
    });
  });

  describe('Shift Retrieval', () => {
    it('should fetch today shifts', async () => {
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

      mockAxiosInstance.get.mockResolvedValue({ data: mockShifts });

      const shifts = await shiftService.getTodayShifts();

      expect(shifts).toEqual(mockShifts);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/shifts/today');
    });

    it('should fetch upcoming shifts', async () => {
      const mockShifts: Shift[] = [
        {
          id: '1',
          guardId: 'guard-123',
          locationName: 'Main Building',
          scheduledStartTime: new Date(Date.now() + 86400000).toISOString(),
          scheduledEndTime: new Date(Date.now() + 86400000 + 8 * 3600000).toISOString(),
          status: 'SCHEDULED',
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockShifts },
      });

      const shifts = await shiftService.getUpcomingShifts();

      expect(shifts).toEqual(mockShifts);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/shifts/upcoming');
    });

    it('should fetch active shift', async () => {
      const mockShift: Shift = {
        id: '1',
        guardId: 'guard-123',
        locationName: 'Main Building',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'IN_PROGRESS',
        actualStartTime: new Date().toISOString(),
      };

      mockAxiosInstance.get.mockResolvedValue({
        data: { success: true, data: mockShift },
      });

      const shift = await shiftService.getActiveShift();

      expect(shift).toEqual(mockShift);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/shifts/active', {
        timeout: 10000,
      });
    });

    it('should return null when no active shift', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 404 },
      });

      const shift = await shiftService.getActiveShift();

      expect(shift).toBeNull();
    });

    it('should handle network error when fetching active shift', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Network Error',
      });

      await expect(shiftService.getActiveShift()).rejects.toThrow(
        'Network Error'
      );
    });

    it('should fetch shift by ID', async () => {
      const mockShift: Shift = {
        id: '1',
        guardId: 'guard-123',
        locationName: 'Main Building',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
        status: 'SCHEDULED',
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockShift });

      const shift = await shiftService.getShiftById('1');

      expect(shift).toEqual(mockShift);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/shifts/1');
    });
  });

  describe('Check-in/Check-out', () => {
    it('should check in to shift successfully', async () => {
      const checkInData: CheckInRequest = {
        shiftId: '1',
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      };

      const mockResponse = {
        message: 'Checked in successfully',
        shift: {
          id: '1',
          status: 'IN_PROGRESS',
          actualStartTime: new Date().toISOString(),
        },
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await shiftService.checkIn(checkInData);

      expect(result.message).toBe('Checked in successfully');
      expect(result.shift.status).toBe('IN_PROGRESS');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/shifts/check-in',
        checkInData
      );
    });

    it('should handle check-in error', async () => {
      const checkInData: CheckInRequest = {
        shiftId: '1',
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      };

      const error = new Error('Cannot check in: shift not found');
      (error as any).response = {
        status: 400,
        data: { error: 'Cannot check in: shift not found' },
      };

      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(shiftService.checkIn(checkInData)).rejects.toThrow();
    });

    it('should check out from shift successfully', async () => {
      const checkOutData: CheckOutRequest = {
        shiftId: '1',
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      };

      const mockResponse = {
        message: 'Checked out successfully',
        shift: {
          id: '1',
          status: 'COMPLETED',
          actualEndTime: new Date().toISOString(),
        },
      };

      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await shiftService.checkOut(checkOutData);

      expect(result.message).toBe('Checked out successfully');
      expect(result.shift.status).toBe('COMPLETED');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/shifts/check-out',
        checkOutData
      );
    });

    it('should handle check-out error', async () => {
      const checkOutData: CheckOutRequest = {
        shiftId: '1',
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      };

      const error = new Error('Cannot check out: no active shift');
      (error as any).response = {
        status: 400,
        data: { error: 'Cannot check out: no active shift' },
      };

      mockAxiosInstance.post.mockRejectedValue(error);

      await expect(shiftService.checkOut(checkOutData)).rejects.toThrow();
    });
  });

  describe('Past Shifts', () => {
    it('should fetch past shifts with limit', async () => {
      const mockShifts: Shift[] = [
        {
          id: '1',
          guardId: 'guard-123',
          locationName: 'Main Building',
          scheduledStartTime: new Date(Date.now() - 86400000).toISOString(),
          scheduledEndTime: new Date(Date.now() - 86400000 + 8 * 3600000).toISOString(),
          status: 'COMPLETED',
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockShifts });

      const shifts = await shiftService.getPastShifts(20);

      expect(shifts).toEqual(mockShifts);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/shifts/past', {
        params: { limit: 20 },
      });
    });
  });

  describe('Weekly Summary', () => {
    it('should fetch weekly shift summary', async () => {
      const mockShifts: Shift[] = [
        {
          id: '1',
          guardId: 'guard-123',
          locationName: 'Main Building',
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: new Date(Date.now() + 8 * 3600000).toISOString(),
          status: 'COMPLETED',
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({ data: mockShifts });

      const shifts = await shiftService.getWeeklyShiftSummary();

      expect(shifts).toEqual(mockShifts);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/shifts/weekly-summary'
      );
    });
  });
});

