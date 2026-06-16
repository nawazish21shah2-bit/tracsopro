/**
 * Operations Service - Admin Operations Center Data
 * Fetches real-time operations data from backend
 */

import apiService from './api';

export interface GuardStatus {
  guardId: string;
  guardName: string;
  status: 'active' | 'on_break' | 'offline' | 'emergency';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  currentSite: string;
  siteId?: string;
  shiftStart: number;
  lastUpdate: number;
  batteryLevel?: number;
  emergencyAlert?: {
    id: string;
    timestamp: number;
    message: string;
    acknowledged: boolean;
  };
}

export interface OperationsMetrics {
  totalGuards: number;
  activeGuards: number;
  guardsOnBreak: number;
  offlineGuards: number;
  emergencyAlerts: number;
  siteCoverage: number;
  averageResponseTime: number;
  incidentsToday: number;
}

export interface EmergencyAlert {
  id: string;
  guardId: string;
  guardName: string;
  type: string;
  message: string;
  timestamp: number;
  location: { latitude: number; longitude: number };
  acknowledged: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface OperationsActivityItem {
  id: string;
  type:
    | 'check_in'
    | 'check_out'
    | 'incident'
    | 'shift_start'
    | 'shift_end'
    | 'break_start'
    | 'break_end'
    | 'emergency';
  guardId: string;
  guardName: string;
  siteName: string;
  message: string;
  timestamp: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'resolved' | 'pending';
}

class OperationsService {
  /**
   * Get operations metrics
   */
  async getOperationsMetrics(): Promise<OperationsMetrics> {
    try {
      const response = await apiService.getRaw<{
        success: boolean;
        data: OperationsMetrics;
      }>('/admin/operations/metrics');
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch operations metrics');
    } catch (error) {
      console.error('Error fetching operations metrics:', error);
      // Return default metrics on error
      return {
        totalGuards: 0,
        activeGuards: 0,
        guardsOnBreak: 0,
        offlineGuards: 0,
        emergencyAlerts: 0,
        siteCoverage: 0,
        averageResponseTime: 0,
        incidentsToday: 0,
      };
    }
  }

  /**
   * Get real-time guard statuses
   */
  async getGuardStatuses(): Promise<GuardStatus[]> {
    try {
      const response = await apiService.getRaw<{
        success: boolean;
        data: GuardStatus[];
      }>('/admin/operations/guards');
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch guard statuses');
    } catch (error) {
      console.error('Error fetching guard statuses:', error);
      return [];
    }
  }

  /**
   * Get active emergency alerts
   */
  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    try {
      const response = await apiService.getRaw<{
        success: boolean;
        data: EmergencyAlert[];
        count: number;
      }>('/emergency/alerts/active');
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch emergency alerts');
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge emergency alert
   */
  async acknowledgeEmergencyAlert(
    alertId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiService.postRaw<{
        success: boolean;
        message: string;
      }>(`/emergency/alert/${alertId}/acknowledge`, {});

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message || 'Failed to acknowledge emergency alert';

      if (
        status === 409 ||
        message.toLowerCase().includes('already acknowledged') ||
        message.toLowerCase().includes('already resolved')
      ) {
        return { success: true, message };
      }

      console.error('Error acknowledging emergency alert:', message, error);
      return { success: false, message };
    }
  }

  /**
   * Get live activity feed for operations center
   */
  async getOperationsActivity(limit = 50): Promise<OperationsActivityItem[]> {
    try {
      const response = await apiService.getRaw<{
        success: boolean;
        data: OperationsActivityItem[];
      }>(`/admin/operations/activity?limit=${limit}`);

      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching operations activity:', error);
      return [];
    }
  }

  /**
   * Get real-time location data for map
   */
  async getRealTimeLocationData(): Promise<any[]> {
    try {
      const response = await apiService.getRaw<{
        success: boolean;
        data: any[];
      }>('/tracking/realtime');
      
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch real-time location data');
    } catch (error) {
      console.error('Error fetching real-time location data:', error);
      return [];
    }
  }
}

export default new OperationsService();



