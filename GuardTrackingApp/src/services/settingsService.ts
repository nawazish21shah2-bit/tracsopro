import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { store } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import { securityManager } from '../utils/security';

import { getApiBaseUrl } from '../config/apiConfig';

const API_BASE_URL = getApiBaseUrl();

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  shiftReminders: boolean;
  incidentAlerts: boolean;
}

export interface ProfileSettings {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  guard?: {
    experience: string;
    certificationUrls: string[];
    status: string;
  };
  client?: {
    accountType: string;
    companyName: string;
    address: string;
    city: string;
    state: string;
  };
}

export interface SupportTicketData {
  subject: string;
  message: string;
  category?: 'technical' | 'billing' | 'general' | 'urgent';
}

export interface AttendanceRecord {
  id: string;
  startTime: string;
  endTime: string;
  checkInTime: string;
  checkOutTime: string;
  actualDuration: number;
  locationName: string;
  locationAddress: string;
}

export interface PastJob {
  id: string;
  startTime: string;
  endTime: string;
  actualDuration: number;
  locationName: string;
  locationAddress: string;
  earnings: number;
}

class SettingsService {
  private async getAuthToken(): Promise<string | null> {
    try {
      // First try to get token from securityManager (preferred method)
      const tokens = await securityManager.getTokens();
      if (tokens?.accessToken) {
        return tokens.accessToken;
      }
      
      // Fallback to direct AsyncStorage (for backward compatibility)
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        return token;
      }
      
      // Also check Redux store as last resort
      const state = store.getState();
      if (state.auth?.token) {
        return state.auth.token;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    
    const response = await fetch(`${API_BASE_URL}/settings${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
      
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        // Clear invalid token
        await AsyncStorage.removeItem('authToken');
        // Dispatch logout action to clear Redux state
        store.dispatch(logoutUser());
        throw new Error('Your session has expired. Please login again.');
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Notification Settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await this.makeRequest('/notifications');
    return response.data;
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await this.makeRequest('/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return response.data;
  }

  // Profile Settings
  async getProfileSettings(): Promise<ProfileSettings> {
    const response = await this.makeRequest('/profile');
    return response.data;
  }

  async updateProfileSettings(profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    timezone?: string;
  }): Promise<ProfileSettings> {
    const response = await this.makeRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.data;
  }

  // Support
  async submitSupportRequest(ticketData: SupportTicketData): Promise<any> {
    const response = await this.makeRequest('/support/contact', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
    return response.data;
  }

  async getSupportTickets(page: number = 1, limit: number = 20): Promise<{
    tickets: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await this.makeRequest(`/support/tickets?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getSupportTicketById(ticketId: string): Promise<any> {
    const response = await this.makeRequest(`/support/tickets/${ticketId}`);
    return response.data;
  }

  // Guard-specific settings
  async getAttendanceHistory(page: number = 1, limit: number = 20): Promise<{
    shifts: AttendanceRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await this.makeRequest(`/attendance-history?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getPastJobs(page: number = 1, limit: number = 20): Promise<{
    jobs: PastJob[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const response = await this.makeRequest(`/past-jobs?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Client-specific settings
  async getCompanyDetails(): Promise<any> {
    const response = await this.makeRequest('/company');
    return response.data;
  }

  async updateCompanyDetails(companyData: {
    companyName?: string;
    companyRegistrationNumber?: string;
    taxId?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    website?: string;
  }): Promise<any> {
    const response = await this.makeRequest('/company', {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
    return response.data;
  }

  // Change Password
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<any> {
    const response = await this.makeRequest('/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
    return response.data;
  }
}

export const settingsService = new SettingsService();
