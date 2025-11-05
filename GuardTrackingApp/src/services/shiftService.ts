import axios from 'axios';
import {
  Shift,
  ShiftStats,
  CheckInRequest,
  CheckOutRequest,
} from '../types/shift.types';
import { securityManager } from '../utils/security';

const API_URL = 'http://localhost:3000/api';

// Create axios instance with auth interceptor
const createAuthAxios = async () => {
  const tokens = await securityManager.getTokens();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(tokens && { Authorization: `Bearer ${tokens.accessToken}` }),
    },
  });
};

class ShiftService {
  /**
   * Get guard's monthly statistics
   */
  async getMonthlyStats(): Promise<ShiftStats> {
    const api = await createAuthAxios();
    const response = await api.get<ShiftStats>('/shifts/stats');
    return response.data;
  }

  /**
   * Get today's shifts
   */
  async getTodayShifts(): Promise<Shift[]> {
    const api = await createAuthAxios();
    const response = await api.get<Shift[]>('/shifts/today');
    return response.data;
  }

  /**
   * Get upcoming shifts
   */
  async getUpcomingShifts(): Promise<Shift[]> {
    const api = await createAuthAxios();
    const response = await api.get<Shift[]>('/shifts/upcoming');
    return response.data;
  }

  /**
   * Get past shifts
   */
  async getPastShifts(limit: number = 20): Promise<Shift[]> {
    const api = await createAuthAxios();
    const response = await api.get<Shift[]>('/shifts/past', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get weekly shift summary
   */
  async getWeeklyShiftSummary(): Promise<Shift[]> {
    const api = await createAuthAxios();
    const response = await api.get<Shift[]>('/shifts/weekly-summary');
    return response.data;
  }

  /**
   * Get active shift
   */
  async getActiveShift(): Promise<Shift | null> {
    const api = await createAuthAxios();
    const response = await api.get<Shift | null>('/shifts/active');
    return response.data;
  }

  /**
   * Get next upcoming shift
   */
  async getNextUpcomingShift(): Promise<Shift | null> {
    const api = await createAuthAxios();
    const response = await api.get<Shift | null>('/shifts/next');
    return response.data;
  }

  /**
   * Get shift by ID
   */
  async getShiftById(shiftId: string): Promise<Shift> {
    const api = await createAuthAxios();
    const response = await api.get<Shift>(`/shifts/${shiftId}`);
    return response.data;
  }

  /**
   * Check in to a shift
   */
  async checkIn(data: CheckInRequest): Promise<{ message: string; shift: Shift }> {
    const api = await createAuthAxios();
    const response = await api.post<{ message: string; shift: Shift }>(
      '/shifts/check-in',
      data
    );
    return response.data;
  }

  /**
   * Check out from a shift
   */
  async checkOut(data: CheckOutRequest): Promise<{ message: string; shift: Shift }> {
    const api = await createAuthAxios();
    const response = await api.post<{ message: string; shift: Shift }>(
      '/shifts/check-out',
      data
    );
    return response.data;
  }
}

export default new ShiftService();
