import axios from 'axios';
import { Platform } from 'react-native';
import {
  Shift,
  ShiftStats,
  CheckInRequest,
  CheckOutRequest,
} from '../types/shift.types';
import { securityManager } from '../utils/security';

import { getApiBaseUrl } from '../config/apiConfig';

const API_URL = getApiBaseUrl();

// Create axios instance with auth interceptor
const createAuthAxios = async () => {
  const tokens = await securityManager.getTokens();
  return axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 second timeout
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
    const response = await api.get<{ success?: boolean; data?: ShiftStats } | ShiftStats>('/shifts/stats');
    
    // Handle wrapped response format
    if ((response.data as any).success && (response.data as any).data) {
      return (response.data as any).data;
    }
    
    // Direct response format
    return response.data as ShiftStats;
  }

  /**
   * Get today's shifts
   */
  async getTodayShifts(): Promise<Shift[]> {
    const api = await createAuthAxios();
    const response = await api.get<{ success: boolean; data: Shift[] }>('/shifts/today');
    
    // Handle wrapped response format
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    // Fallback for direct array response
    if (Array.isArray(response.data)) {
      return response.data as unknown as Shift[];
    }
    
    return [];
  }

  /**
   * Get upcoming shifts
   */
  async getUpcomingShifts(): Promise<Shift[]> {
    const api = await createAuthAxios();
    const response = await api.get<{ success: boolean; data: Shift[] }>('/shifts/upcoming');
    
    // Handle response format
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return [];
  }

  /**
   * Get past shifts
   */
  async getPastShifts(limit: number = 20): Promise<Shift[]> {
    const api = await createAuthAxios();
    const response = await api.get<{ success: boolean; data: Shift[] }>('/shifts/past', {
      params: { limit },
    });
    
    // Handle wrapped response format
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    // Fallback for direct array response
    if (Array.isArray(response.data)) {
      return response.data as unknown as Shift[];
    }
    
    return [];
  }

  /**
   * Get weekly shift summary
   */
  async getWeeklyShiftSummary(): Promise<Shift[]> {
    const api = await createAuthAxios();
    const response = await api.get<{ success: boolean; data: Shift[] }>('/shifts/weekly-summary');
    
    // Handle wrapped response format
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    // Fallback for direct array response
    if (Array.isArray(response.data)) {
      return response.data as unknown as Shift[];
    }
    
    return [];
  }

  /**
   * Get active shift
   */
  async getActiveShift(): Promise<Shift | null> {
    try {
      const api = await createAuthAxios();
      const response = await api.get<{ success: boolean; data?: Shift; message?: string; error?: string }>('/shifts/active', {
        timeout: 10000, // 10 second timeout
      });
      
      // Handle success response with data
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Handle 404 (no active shift) - return null instead of error
      return null;
    } catch (error: any) {
      // Handle network errors
      if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Network Error: Unable to connect to server. Please check your connection.');
      }
      
      // Handle 404 as a valid case (no active shift)
      if (error.response?.status === 404) {
        return null;
      }
      
      // Handle 401 (unauthorized) - might need to refresh token
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Re-throw other errors with better message
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch active shift';
      throw new Error(errorMessage);
    }
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
    try {
      const api = await createAuthAxios();
      const response = await api.get<{ success: boolean; data: ShiftStats }>('/shifts/statistics', {
        params,
      });
      
      // Handle response format
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Return default stats if no data
      return {
        completedShifts: 0,
        missedShifts: 0,
        totalSites: 0,
        incidentReports: 0,
      };
    } catch (error: any) {
      // Handle 404 or other errors gracefully
      if (error.response?.status === 404) {
        return {
          completedShifts: 0,
          missedShifts: 0,
          totalSites: 0,
          incidentReports: 0,
        };
      }
      throw error;
    }
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
  async startBreakV2(shiftId: string, breakType: string, location?: {
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
  async endBreakV2(shiftId: string, breakId: string, location?: {
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
