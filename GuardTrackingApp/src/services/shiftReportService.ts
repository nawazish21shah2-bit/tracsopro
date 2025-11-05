import axios from 'axios';
import {
  ShiftReport,
  CreateShiftReportRequest,
  UpdateShiftReportRequest,
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

class ShiftReportService {
  /**
   * Create a shift report
   */
  async createShiftReport(
    data: CreateShiftReportRequest
  ): Promise<{ message: string; report: ShiftReport }> {
    const api = await createAuthAxios();
    const response = await api.post<{ message: string; report: ShiftReport }>(
      '/shift-reports',
      data
    );
    return response.data;
  }

  /**
   * Get all reports for the current guard
   */
  async getGuardReports(limit: number = 50): Promise<ShiftReport[]> {
    const api = await createAuthAxios();
    const response = await api.get<ShiftReport[]>('/shift-reports', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get report by ID
   */
  async getShiftReportById(reportId: string): Promise<ShiftReport> {
    const api = await createAuthAxios();
    const response = await api.get<ShiftReport>(`/shift-reports/${reportId}`);
    return response.data;
  }

  /**
   * Get reports for a specific shift
   */
  async getShiftReports(shiftId: string): Promise<ShiftReport[]> {
    const api = await createAuthAxios();
    const response = await api.get<ShiftReport[]>(`/shift-reports/shift/${shiftId}`);
    return response.data;
  }

  /**
   * Update a shift report
   */
  async updateShiftReport(
    reportId: string,
    data: UpdateShiftReportRequest
  ): Promise<{ message: string; report: ShiftReport }> {
    const api = await createAuthAxios();
    const response = await api.put<{ message: string; report: ShiftReport }>(
      `/shift-reports/${reportId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a shift report
   */
  async deleteShiftReport(reportId: string): Promise<{ message: string }> {
    const api = await createAuthAxios();
    const response = await api.delete<{ message: string }>(
      `/shift-reports/${reportId}`
    );
    return response.data;
  }
}

export default new ShiftReportService();
