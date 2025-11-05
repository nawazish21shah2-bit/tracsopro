import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000/api' 
    : 'http://localhost:3000/api'
  : 'http://localhost:3000/api';

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
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
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
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
}

export const settingsService = new SettingsService();
