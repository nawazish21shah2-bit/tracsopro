// Offline Support Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import { addTrackingData } from '../store/slices/locationSlice';
import { createIncident } from '../store/slices/incidentSlice';
import { sendMessage } from '../store/slices/messageSlice';

interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

class OfflineService {
  private isOnline = true;
  private offlineActions: OfflineAction[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly OFFLINE_ACTIONS_KEY = 'offline_actions';
  private readonly SYNC_INTERVAL = 30000; // 30 seconds

  async initialize() {
    // Check initial network status
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected ?? false;

    // Listen for network changes
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
      this.handleNetworkChange();
    });

    // Load offline actions from storage
    await this.loadOfflineActions();

    // Start sync interval
    this.startSyncInterval();
  }

  private async loadOfflineActions() {
    try {
      const stored = await AsyncStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      if (stored) {
        this.offlineActions = JSON.parse(stored).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }
    } catch (error) {
      console.error('Error loading offline actions:', error);
    }
  }

  private async saveOfflineActions() {
    try {
      await AsyncStorage.setItem(
        this.OFFLINE_ACTIONS_KEY,
        JSON.stringify(this.offlineActions)
      );
    } catch (error) {
      console.error('Error saving offline actions:', error);
    }
  }

  private handleNetworkChange() {
    if (this.isOnline) {
      console.log('Network connected - starting sync');
      this.syncOfflineActions();
    } else {
      console.log('Network disconnected - going offline');
      this.stopSyncInterval();
    }
  }

  private startSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.offlineActions.length > 0) {
        this.syncOfflineActions();
      }
    }, this.SYNC_INTERVAL);
  }

  private stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncOfflineActions() {
    if (!this.isOnline || this.offlineActions.length === 0) {
      return;
    }

    console.log(`Syncing ${this.offlineActions.length} offline actions`);

    const actionsToSync = [...this.offlineActions];
    const successfulActions: string[] = [];

    for (const action of actionsToSync) {
      try {
        await this.executeOfflineAction(action);
        successfulActions.push(action.id);
      } catch (error) {
        console.error(`Error syncing action ${action.id}:`, error);
        action.retryCount++;
        
        if (action.retryCount >= action.maxRetries) {
          console.log(`Max retries reached for action ${action.id}, removing`);
          successfulActions.push(action.id);
        }
      }
    }

    // Remove successful actions
    this.offlineActions = this.offlineActions.filter(
      action => !successfulActions.includes(action.id)
    );

    await this.saveOfflineActions();
  }

  private async executeOfflineAction(action: OfflineAction) {
    switch (action.type) {
      case 'location_update':
        await this.syncLocationUpdate(action.payload);
        break;
      case 'incident_create':
        await this.syncIncidentCreate(action.payload);
        break;
      case 'message_send':
        await this.syncMessageSend(action.payload);
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private async syncLocationUpdate(payload: any) {
    // In a real app, you'd call your API service
    console.log('Syncing location update:', payload);
    // await apiService.sendLocationUpdate(payload);
  }

  private async syncIncidentCreate(payload: any) {
    // In a real app, you'd call your API service
    console.log('Syncing incident create:', payload);
    // await apiService.createIncident(payload);
  }

  private async syncMessageSend(payload: any) {
    // In a real app, you'd call your API service
    console.log('Syncing message send:', payload);
    // await apiService.sendMessage(payload);
  }

  // Add offline action
  async addOfflineAction(type: string, payload: any, maxRetries: number = 3) {
    const action: OfflineAction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries,
    };

    this.offlineActions.push(action);
    await this.saveOfflineActions();

    // If online, try to sync immediately
    if (this.isOnline) {
      try {
        await this.executeOfflineAction(action);
        // Remove from queue if successful
        this.offlineActions = this.offlineActions.filter(a => a.id !== action.id);
        await this.saveOfflineActions();
      } catch (error) {
        console.error('Error executing action immediately:', error);
      }
    }
  }

  // Offline location tracking
  async trackLocationOffline(guardId: string, coordinates: any, accuracy: number, batteryLevel: number) {
    const trackingData = {
      guardId,
      coordinates,
      accuracy,
      batteryLevel,
      timestamp: new Date(),
    };

    // Store locally
    store.dispatch(addTrackingData({
      id: Date.now().toString(),
      guardId,
      coordinates,
      timestamp: new Date(),
      batteryLevel,
      isOnline: this.isOnline,
      accuracy,
    }));

    // Add to offline queue
    await this.addOfflineAction('location_update', trackingData);
  }

  // Offline incident creation
  async createIncidentOffline(incidentData: any) {
    // Store locally
    store.dispatch(createIncident(incidentData));

    // Add to offline queue
    await this.addOfflineAction('incident_create', incidentData);
  }

  // Offline message sending
  async sendMessageOffline(messageData: any) {
    // Store locally
    store.dispatch(sendMessage(messageData));

    // Add to offline queue
    await this.addOfflineAction('message_send', messageData);
  }

  // Get offline actions count
  getOfflineActionsCount(): number {
    return this.offlineActions.length;
  }

  // Get offline actions
  getOfflineActions(): OfflineAction[] {
    return [...this.offlineActions];
  }

  // Clear offline actions
  async clearOfflineActions() {
    this.offlineActions = [];
    await AsyncStorage.removeItem(this.OFFLINE_ACTIONS_KEY);
  }

  // Check if online
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // Force sync
  async forceSync() {
    if (this.isOnline) {
      await this.syncOfflineActions();
    }
  }

  // Get network status
  async getNetworkStatus() {
    const netInfo = await NetInfo.fetch();
    return {
      isConnected: netInfo.isConnected,
      type: netInfo.type,
      isInternetReachable: netInfo.isInternetReachable,
    };
  }

  // Cleanup
  destroy() {
    this.stopSyncInterval();
  }
}

export default new OfflineService();
