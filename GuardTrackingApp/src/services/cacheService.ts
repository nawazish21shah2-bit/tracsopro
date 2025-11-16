import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ErrorHandler } from '../utils/errorHandler';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface SyncQueueItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class CacheService {
  private static instance: CacheService;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
  }

  /**
   * Initialize network state listener
   */
  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected === true;
      
      // If we just came back online, sync pending data
      if (wasOffline && this.isOnline) {
        this.processSyncQueue();
      }
    });
  }

  /**
   * Store data in cache with expiry
   */
  async set<T>(key: string, data: T, expiryMinutes: number = 60): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + (expiryMinutes * 60 * 1000),
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      ErrorHandler.handleError(error, 'cache_set', false);
    }
  }

  /**
   * Get data from cache if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > cacheItem.expiry) {
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      ErrorHandler.handleError(error, 'cache_get', false);
      return null;
    }
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      ErrorHandler.handleError(error, 'cache_remove', false);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      ErrorHandler.handleError(error, 'cache_clear', false);
    }
  }

  /**
   * Get cache info (size, items count)
   */
  async getCacheInfo(): Promise<{ itemCount: number; totalSize: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }

      return {
        itemCount: cacheKeys.length,
        totalSize,
      };
    } catch (error) {
      ErrorHandler.handleError(error, 'cache_info', false);
      return { itemCount: 0, totalSize: 0 };
    }
  }

  /**
   * Add action to sync queue for offline operations
   */
  async addToSyncQueue(action: string, data: any): Promise<void> {
    try {
      const queueItem: SyncQueueItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      this.syncQueue.push(queueItem);
      await this.saveSyncQueue();

      // Try to sync immediately if online
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'sync_queue_add', false);
    }
  }

  /**
   * Process sync queue when online
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;

    try {
      const itemsToSync = [...this.syncQueue];
      
      for (const item of itemsToSync) {
        try {
          await this.syncItem(item);
          
          // Remove from queue on success
          this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
        } catch (error) {
          // Increment retry count
          const queueItem = this.syncQueue.find(q => q.id === item.id);
          if (queueItem) {
            queueItem.retryCount++;
            
            // Remove if too many retries (max 5)
            if (queueItem.retryCount >= 5) {
              this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
              ErrorHandler.handleError(
                new Error(`Sync failed after 5 retries: ${item.action}`),
                'sync_max_retries',
                false
              );
            }
          }
        }
      }

      await this.saveSyncQueue();
    } catch (error) {
      ErrorHandler.handleError(error, 'sync_queue_process', false);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // This would be implemented based on your specific sync requirements
    // For example, syncing check-ins, incident reports, etc.
    
    switch (item.action) {
      case 'check_in':
        // await shiftService.checkIn(item.data);
        break;
      case 'check_out':
        // await shiftService.checkOut(item.data);
        break;
      case 'incident_report':
        // await shiftService.createIncidentReport(item.data);
        break;
      case 'break_start':
        // await shiftService.startBreak(item.data);
        break;
      case 'break_end':
        // await shiftService.endBreak(item.data);
        break;
      default:
        throw new Error(`Unknown sync action: ${item.action}`);
    }
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queue = await AsyncStorage.getItem('sync_queue');
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      ErrorHandler.handleError(error, 'sync_queue_load', false);
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      ErrorHandler.handleError(error, 'sync_queue_save', false);
    }
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus(): {
    itemCount: number;
    isOnline: boolean;
    syncInProgress: boolean;
  } {
    return {
      itemCount: this.syncQueue.length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  /**
   * Force sync queue processing
   */
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
  }
}

export const cacheService = CacheService.getInstance();
