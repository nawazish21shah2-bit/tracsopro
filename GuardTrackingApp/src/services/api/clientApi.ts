import apiService from '../api';

export const clientApi = {
  getClientDashboardStats: () => apiService.getClientDashboardStats(),
  getClientGuards: (page?: number, limit?: number) => apiService.getClientGuards(page, limit),
  getClientGuardProfile: (guardId: string) => apiService.getClientGuardProfile(guardId),
  getClientReports: (page?: number, limit?: number) => apiService.getClientReports(page, limit),
  getClientSites: (page?: number, limit?: number) => apiService.getClientSites(page, limit),
  getClientShifts: (options?: Parameters<typeof apiService.getClientShifts>[0]) =>
    apiService.getClientShifts(options),
  updateClientSite: (siteId: string, data: Parameters<typeof apiService.updateClientSite>[1]) =>
    apiService.updateClientSite(siteId, data),
  deleteClientSite: (siteId: string) => apiService.deleteClientSite(siteId),
  getClientNotifications: (page?: number, limit?: number) =>
    apiService.getClientNotifications(page, limit),
  getClientProfile: () => apiService.getClientProfile(),
  updateClientProfile: (data: Parameters<typeof apiService.updateClientProfile>[0]) =>
    apiService.updateClientProfile(data),
  createClientShift: (data: Parameters<typeof apiService.createClientShift>[0]) =>
    apiService.createClientShift(data),
  updateClientShift: (shiftId: string, data: Parameters<typeof apiService.updateClientShift>[1]) =>
    apiService.updateClientShift(shiftId, data),
  deleteClientShift: (shiftId: string) => apiService.deleteClientShift(shiftId),
  getSiteById: (siteId: string) => apiService.getSiteById(siteId),
  respondToClientReport: (
    reportId: string,
    status: Parameters<typeof apiService.respondToClientReport>[1],
    responseNotes?: string,
  ) => apiService.respondToClientReport(reportId, status, responseNotes),
};
