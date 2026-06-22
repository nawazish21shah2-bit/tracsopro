import apiService from '../api';

export const incidentApi = {
  getIncidents: (page?: number, limit?: number) => apiService.getIncidents(page, limit),
  createIncident: (incidentData: Parameters<typeof apiService.createIncident>[0]) =>
    apiService.createIncident(incidentData),
  updateIncident: (id: string, incidentData: Parameters<typeof apiService.updateIncident>[1]) =>
    apiService.updateIncident(id, incidentData),
  getAllIncidentReports: (params?: Parameters<typeof apiService.getAllIncidentReports>[0]) =>
    apiService.getAllIncidentReports(params),
  getIncidentReportStats: (params?: Parameters<typeof apiService.getIncidentReportStats>[0]) =>
    apiService.getIncidentReportStats(params),
  updateIncidentReport: (
    id: string,
    updateData: Parameters<typeof apiService.updateIncidentReport>[1],
  ) => apiService.updateIncidentReport(id, updateData),
  getGuardIncidentReports: (page?: number, limit?: number) =>
    apiService.getGuardIncidentReports(page, limit),
  getCompanyShiftReports: (page?: number, limit?: number) =>
    apiService.getCompanyShiftReports(page, limit),
  respondToReport: (
    reportId: string,
    status: string,
    responseNotes?: string,
  ) => apiService.respondToReport(reportId, status, responseNotes),
  createIncidentReport: async (data: Record<string, unknown>) => {
    const response = await apiService.post<{ success?: boolean; message?: string; data?: unknown }>(
      '/incident-reports',
      data,
    );
    return {
      success: response.data?.success !== false,
      data: response.data?.data ?? response.data,
      message: response.data?.message,
    };
  },
};
