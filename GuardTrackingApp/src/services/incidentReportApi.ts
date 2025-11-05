// Incident Report API Service
import { ApiService } from './api';

interface CreateIncidentReportData {
  reportType: string;
  description: string;
  location?: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
  mediaFiles?: {
    url: string;
    type: 'image' | 'video';
    name?: string;
  }[];
}

interface IncidentReportFilters {
  page?: number;
  limit?: number;
  reportType?: string;
  startDate?: string;
  endDate?: string;
}

class IncidentReportApi extends ApiService {
  async createIncidentReport(data: CreateIncidentReportData) {
    try {
      const response = await this.api.post('/incident-reports', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to create incident report'
      };
    }
  }

  async getIncidentReports(filters: IncidentReportFilters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.reportType) params.append('reportType', filters.reportType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiService.api.get(`/incident-reports?${params.toString()}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch incident reports'
      };
    }
  }

  async getIncidentReportById(id: string) {
    try {
      const response = await apiService.api.get(`/incident-reports/${id}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to fetch incident report'
      };
    }
  }

  async updateIncidentReport(id: string, data: Partial<CreateIncidentReportData>) {
    try {
      const response = await apiService.api.put(`/incident-reports/${id}`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update incident report'
      };
    }
  }

  async deleteIncidentReport(id: string) {
    try {
      const response = await apiService.api.delete(`/incident-reports/${id}`);
      return {
        success: true,
        data: null,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to delete incident report'
      };
    }
  }
}

export default new IncidentReportApi();
