import apiService from '../api';

export const adminApi = {
  getAdminUsers: (params?: Parameters<typeof apiService.getAdminUsers>[0]) =>
    apiService.getAdminUsers(params),
  createAdminUser: (data: Parameters<typeof apiService.createAdminUser>[0]) =>
    apiService.createAdminUser(data),
  updateAdminUser: (userId: string, data: Parameters<typeof apiService.updateAdminUser>[1]) =>
    apiService.updateAdminUser(userId, data),
  updateAdminUserStatus: (userId: string, isActive: boolean) =>
    apiService.updateAdminUserStatus(userId, isActive),
  deleteAdminUser: (userId: string) => apiService.deleteAdminUser(userId),
  getGuards: (page?: number, limit?: number) => apiService.getGuards(page, limit),
  getAdminSites: (params?: Parameters<typeof apiService.getAdminSites>[0]) =>
    apiService.getAdminSites(params),
  getAdminClients: (params?: Parameters<typeof apiService.getAdminClients>[0]) =>
    apiService.getAdminClients(params),
  createAdminSite: (data: Parameters<typeof apiService.createAdminSite>[0]) =>
    apiService.createAdminSite(data),
  updateAdminSite: (siteId: string, data: Parameters<typeof apiService.updateAdminSite>[1]) =>
    apiService.updateAdminSite(siteId, data),
  deleteAdminSite: (siteId: string) => apiService.deleteAdminSite(siteId),
  getInvitations: (filters?: Parameters<typeof apiService.getInvitations>[0]) =>
    apiService.getInvitations(filters),
  createInvitation: (data: Parameters<typeof apiService.createInvitation>[0]) =>
    apiService.createInvitation(data),
  revokeInvitation: (invitationId: string) => apiService.revokeInvitation(invitationId),
  deleteInvitation: (invitationId: string) => apiService.deleteInvitation(invitationId),
  getSubscriptionOverview: () => apiService.getSubscriptionOverview(),
  getAdminSubscription: () => apiService.getAdminSubscription(),
  getClients: (page?: number, limit?: number) => apiService.getClients(page, limit),
  getAdminDashboardStats: () => apiService.getAdminDashboardStats(),
  getAdminRecentActivity: (limit?: number) => apiService.getAdminRecentActivity(limit),
  getGuard: (id: string) => apiService.getGuard(id),
  createGuard: (guardData: Parameters<typeof apiService.createGuard>[0]) =>
    apiService.createGuard(guardData),
  updateGuard: (id: string, guardData: Parameters<typeof apiService.updateGuard>[1]) =>
    apiService.updateGuard(id, guardData),
  deleteGuard: (id: string) => apiService.deleteGuard(id),
};
