import apiService from '../../services/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardStatsResponse {
  guardsOnDuty: number;
  missedShifts: number;
  activeSites: number;
  newReports: number;
}

export interface GuardResponse {
  guards: Array<{
    id: string;
    name: string;
    avatar?: string;
    site?: string;
    shiftTime?: string;
    status: 'Active' | 'Upcoming' | 'Missed' | 'Completed';
    checkInTime?: string;
    pastJobs?: number;
    rating?: number;
    availability?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ReportResponse {
  reports: Array<{
    id: string;
    type: 'Medical Emergency' | 'Incident' | 'Violation' | 'Maintenance';
    guardName: string;
    guardAvatar?: string;
    site: string;
    time: string;
    description: string;
    status: 'Respond' | 'New' | 'Reviewed';
    checkInTime?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SiteResponse {
  sites: Array<{
    id: string;
    name: string;
    address: string;
    guardName: string;
    guardAvatar?: string;
    status: 'Active' | 'Upcoming' | 'Missed';
    shiftTime?: string;
    checkInTime?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NotificationResponse {
  notifications: Array<{
    id: string;
    guardName: string;
    guardAvatar?: string;
    action: string;
    site: string;
    time?: string;
    status: 'Active';
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const clientApi = {
  // Dashboard Stats
  getDashboardStats: (): Promise<ApiResponse<DashboardStatsResponse>> =>
    apiService.getClientDashboardStats(),

  // Guards
  getMyGuards: (page: number = 1, limit: number = 50): Promise<ApiResponse<GuardResponse>> =>
    apiService.getClientGuards(page, limit),

  // Reports
  getMyReports: (page: number = 1, limit: number = 50): Promise<ApiResponse<ReportResponse>> =>
    apiService.getClientReports(page, limit),

  // Sites
  getMySites: (page: number = 1, limit: number = 50): Promise<ApiResponse<SiteResponse>> =>
    apiService.getClientSites(page, limit),

  // Notifications
  getMyNotifications: (page: number = 1, limit: number = 50): Promise<ApiResponse<NotificationResponse>> =>
    apiService.getClientNotifications(page, limit),

  // Profile
  getMyProfile: (): Promise<ApiResponse<any>> =>
    apiService.getClientProfile(),

  updateProfile: (data: any): Promise<ApiResponse<any>> =>
    apiService.updateClientProfile(data),
};
