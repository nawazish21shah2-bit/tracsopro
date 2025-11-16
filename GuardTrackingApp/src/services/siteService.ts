import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { securityManager } from '../utils/security';
import api from './api';

// Use 10.0.2.2 for Android emulator, localhost for iOS simulator
const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000/api' 
    : 'http://localhost:3000/api'
  : 'http://localhost:3000/api';

export interface CreateSiteData {
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description?: string;
  requirements?: string;
  contactPerson?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  requirements?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

class SiteService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const tokens = await securityManager.getTokens();
      return tokens?.accessToken || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/sites${endpoint}`, {
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

  // Create a new site
  async createSite(siteData: CreateSiteData): Promise<Site> {
    const response = await this.makeRequest('', {
      method: 'POST',
      body: JSON.stringify(siteData),
    });
    return response.data;
  }

  // Get all sites for the current client
  async getClientSites(page: number = 1, limit: number = 10): Promise<{
    sites: Site[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const resp = await api.getClientSites(page, limit);
      if (!resp.success) {
        throw new Error(resp.message || 'Failed to fetch sites');
      }
      // The ApiService returns data from backend as response.data.data
      // which is expected to contain { sites, pagination }
      return resp.data;
    } catch (error: any) {
      // Re-throw with message so callers keep existing error handling
      throw new Error(error.message || 'Failed to fetch sites');
    }
  }

  // Get site by ID
  async getSiteById(siteId: string): Promise<Site> {
    const response = await this.makeRequest(`/${siteId}`);
    return response.data;
  }

  // Update site
  async updateSite(siteId: string, siteData: Partial<CreateSiteData>): Promise<Site> {
    const response = await this.makeRequest(`/${siteId}`, {
      method: 'PUT',
      body: JSON.stringify(siteData),
    });
    return response.data;
  }

  // Delete site
  async deleteSite(siteId: string): Promise<{ message: string }> {
    const response = await this.makeRequest(`/${siteId}`, {
      method: 'DELETE',
    });
    return response.data;
  }

  // Get all active sites (for guards to browse)
  async getActiveSites(page: number = 1, limit: number = 10, search?: string): Promise<{
    sites: Site[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const response = await this.makeRequest(`/active?page=${page}&limit=${limit}${searchParam}`);
    return response.data;
  }
}

export const siteService = new SiteService();
