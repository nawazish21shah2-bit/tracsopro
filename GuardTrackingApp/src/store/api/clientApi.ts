import { clientApi as clientDomainApi } from '../../services/api/clientApi';

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

/** Typed client dashboard API — delegates to domain clientApi facade. */
export const clientApi = {
  getDashboardStats: (): Promise<ApiResponse<DashboardStatsResponse>> =>
    clientDomainApi.getClientDashboardStats(),

  getMyGuards: (page: number = 1, limit: number = 50): Promise<ApiResponse<GuardResponse>> =>
    clientDomainApi.getClientGuards(page, limit),

  getMyReports: (page: number = 1, limit: number = 50): Promise<ApiResponse<ReportResponse>> =>
    clientDomainApi.getClientReports(page, limit),

  getMySites: (page: number = 1, limit: number = 50): Promise<ApiResponse<SiteResponse>> =>
    clientDomainApi.getClientSites(page, limit),

  getMyNotifications: (page: number = 1, limit: number = 50): Promise<ApiResponse<NotificationResponse>> =>
    clientDomainApi.getClientNotifications(page, limit),

  getMyProfile: (): Promise<ApiResponse<any>> => clientDomainApi.getClientProfile(),

  updateProfile: (data: any): Promise<ApiResponse<any>> => clientDomainApi.updateClientProfile(data),
};
