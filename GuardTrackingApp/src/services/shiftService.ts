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

  // Phase 2: Enhanced Shift Management Methods

  /**
   * Get shift statistics
   */
  async getShiftStatistics(params: { startDate?: string; endDate?: string } = {}): Promise<ShiftStats> {
    const api = await createAuthAxios();
    const response = await api.get<{ success: boolean; data: ShiftStats }>('/shifts/statistics', {
      params,
    });
    return response.data.data;
  }

  /**
   * Check in to shift with GPS location (Phase 2)
   */
  async checkInToShift(shiftId: string, location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  }): Promise<Shift> {
    const api = await createAuthAxios();
    const response = await api.post<{ success: boolean; data: Shift }>(
      `/shifts/${shiftId}/check-in`,
      { location }
    );
    return response.data.data;
  }

  // Phase 3: Enhanced Methods

  /**
   * Create incident report
   */
  async createIncidentReport(data: {
    shiftId: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    photos?: string[];
    location?: { latitude: number; longitude: number };
  }): Promise<any> {
    const api = await createAuthAxios();
    const response = await api.post('/incidents', data);
    return response.data;
  }

  /**
   * Start break
   */
  async startBreak(data: {
    shiftId: string;
    breakType: 'lunch' | 'short' | 'emergency';
  }): Promise<any> {
    const api = await createAuthAxios();
    const response = await api.post('/breaks/start', data);
    return response.data;
  }

  /**
   * End break
   */
  async endBreak(breakId: string): Promise<any> {
    const api = await createAuthAxios();
    const response = await api.post(`/breaks/${breakId}/end`);
    return response.data;
  }

  /**
   * Get notifications
   */
  async getNotifications(): Promise<any[]> {
    const api = await createAuthAxios();
    const response = await api.get('/notifications');
    return response.data;
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    const api = await createAuthAxios();
    await api.patch(`/notifications/${notificationId}/read`);
  }

  /**
   * Get incidents for shift
   */
  async getShiftIncidents(shiftId: string): Promise<any[]> {
    const api = await createAuthAxios();
    const response = await api.get(`/shifts/${shiftId}/incidents`);
    return response.data;
  }

  /**
   * Upload photo for incident
   */
  async uploadIncidentPhoto(file: FormData): Promise<{ url: string }> {
    const api = await createAuthAxios();
    const response = await api.post('/uploads/incident-photo', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Check out from shift with GPS location (Phase 2)
   */
  async checkOutFromShift(shiftId: string, location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: string;
  }, notes?: string): Promise<Shift> {
    const api = await createAuthAxios();
    const response = await api.post<{ success: boolean; data: Shift }>(
      `/shifts/${shiftId}/check-out`,
      { location, notes }
    );
    return response.data.data;
  }

  /**
   * Start break during shift (Phase 2)
   */
  async startBreak(shiftId: string, breakType: string, location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }, notes?: string): Promise<any> {
    const api = await createAuthAxios();
    const response = await api.post<{ success: boolean; data: any }>(
      `/shifts/${shiftId}/start-break`,
      { breakType, location, notes }
    );
    return response.data.data;
  }

  /**
   * End break during shift (Phase 2)
   */
  async endBreak(shiftId: string, breakId: string, location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }, notes?: string): Promise<any> {
    const api = await createAuthAxios();
    const response = await api.post<{ success: boolean; data: any }>(
      `/shifts/${shiftId}/end-break/${breakId}`,
      { location, notes }
    );
    return response.data.data;
  }

  /**
   * Report incident during shift (Phase 2)
   */
  async reportIncident(shiftId: string, incident: {
    incidentType: string;
    severity: string;
    title: string;
    description: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      address?: string;
    };
    attachments?: string[];
  }): Promise<any> {
    const api = await createAuthAxios();
    const response = await api.post<{ success: boolean; data: any }>(
      `/shifts/${shiftId}/report-incident`,
      incident
    );
    return response.data.data;
  }

  /**
   * Create new shift
   */
  async createShift(shiftData: {
    locationName: string;
    locationAddress: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    description?: string;
    notes?: string;
  }): Promise<Shift> {
    const api = await createAuthAxios();
    const response = await api.post<{ success: boolean; data: Shift }>(
      '/shifts',
      shiftData
    );
    return response.data.data;
  }
}

export default new ShiftService();
