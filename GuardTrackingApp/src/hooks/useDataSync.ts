import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { RootState } from '../store';
import { syncAllData } from '../store/slices/shiftSlice';
import { cacheService } from '../services/cacheService';
import { ErrorHandler } from '../utils/errorHandler';

interface DataSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingItems: number;
  error: string | null;
}

interface UseDataSyncReturn extends DataSyncState {
  sync: () => Promise<void>;
  forcSync: () => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheInfo: () => Promise<{ itemCount: number; totalSize: number }>;
}

export const useDataSync = (): UseDataSyncReturn => {
  const dispatch = useDispatch();
  const { lastSyncTime, networkStatus } = useSelector((state: RootState) => state.shifts);
  
  const [syncState, setSyncState] = useState<DataSyncState>({
    isOnline: true,
    isSyncing: false,
    lastSyncTime: lastSyncTime,
    pendingItems: 0,
    error: null,
  });

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected === true;
      
      setSyncState(prev => ({
        ...prev,
        isOnline,
        error: isOnline ? null : 'No internet connection',
      }));

      // Auto-sync when coming back online
      if (isOnline && !syncState.isOnline) {
        sync();
      }
    });

    return unsubscribe;
  }, []);

  // Monitor sync queue status
  useEffect(() => {
    const checkSyncQueue = () => {
      const queueStatus = cacheService.getSyncQueueStatus();
      setSyncState(prev => ({
        ...prev,
        pendingItems: queueStatus.itemCount,
        isSyncing: queueStatus.syncInProgress,
      }));
    };

    // Check immediately
    checkSyncQueue();

    // Check periodically
    const interval = setInterval(checkSyncQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync data
  const sync = useCallback(async () => {
    if (!syncState.isOnline) {
      setSyncState(prev => ({
        ...prev,
        error: 'Cannot sync while offline',
      }));
      return;
    }

    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Sync Redux data
      await dispatch(syncAllData() as any);
      
      // Process offline queue
      await cacheService.forcSync();
      
      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
        pendingItems: 0,
      }));
    } catch (error) {
      const errorMessage = ErrorHandler.handleError(error, 'data_sync', false);
      setSyncState(prev => ({
        ...prev,
        error: errorMessage.message,
      }));
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [dispatch, syncState.isOnline]);

  // Force sync (ignores online status for testing)
  const forcSync = useCallback(async () => {
    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      await dispatch(syncAllData() as any);
      await cacheService.forcSync();
      
      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
        pendingItems: 0,
      }));
    } catch (error) {
      const errorMessage = ErrorHandler.handleError(error, 'force_sync', false);
      setSyncState(prev => ({
        ...prev,
        error: errorMessage.message,
      }));
    } finally {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [dispatch]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await cacheService.clear();
      await cacheService.clearSyncQueue();
      
      setSyncState(prev => ({
        ...prev,
        pendingItems: 0,
        lastSyncTime: null,
      }));
    } catch (error) {
      ErrorHandler.handleError(error, 'clear_cache');
    }
  }, []);

  // Get cache info
  const getCacheInfo = useCallback(async () => {
    return await cacheService.getCacheInfo();
  }, []);

  return {
    ...syncState,
    sync,
    forcSync,
    clearCache,
    getCacheInfo,
  };
};

// Hook for offline-first data operations
export const useOfflineOperation = () => {
  const { isOnline } = useDataSync();

  const executeOperation = useCallback(async <T>(
    onlineOperation: () => Promise<T>,
    offlineAction: string,
    offlineData: any,
    fallbackData?: T
  ): Promise<T> => {
    if (isOnline) {
      try {
        return await onlineOperation();
      } catch (error) {
        // If online operation fails, queue for later
        await cacheService.addToSyncQueue(offlineAction, offlineData);
        
        if (fallbackData !== undefined) {
          return fallbackData;
        }
        throw error;
      }
    } else {
      // Queue for when online
      await cacheService.addToSyncQueue(offlineAction, offlineData);
      
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      
      throw new Error('Operation queued for when online');
    }
  }, [isOnline]);

  return { executeOperation, isOnline };
};

// Hook for cached data with automatic refresh
export const useCachedData = <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  expiryMinutes: number = 60
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useDataSync();

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      // Try cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = await cacheService.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          
          // If online, still fetch fresh data in background
          if (isOnline) {
            try {
              const freshData = await fetchFunction();
              setData(freshData);
              await cacheService.set(key, freshData, expiryMinutes);
            } catch (error) {
              // Ignore background fetch errors if we have cached data
            }
          }
          return;
        }
      }

      // Fetch fresh data
      if (isOnline) {
        const freshData = await fetchFunction();
        setData(freshData);
        await cacheService.set(key, freshData, expiryMinutes);
      } else {
        throw new Error('No cached data available and device is offline');
      }
    } catch (error) {
      const errorMessage = ErrorHandler.handleError(error, `fetch_${key}`, false);
      setError(errorMessage.message);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFunction, expiryMinutes, isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    isOnline,
  };
};
