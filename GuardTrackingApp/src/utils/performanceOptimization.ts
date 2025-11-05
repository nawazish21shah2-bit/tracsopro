// Performance Optimization Utilities for Guard Tracking App
import React, { lazy, Suspense, ComponentType, ReactElement } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useEffect, useState } from 'react';

// Lazy Loading Components
export const LazyLoginScreen = lazy(() => import('../screens/auth/LoginScreen'));
export const LazyRegisterScreen = lazy(() => import('../screens/auth/RegisterScreen'));
export const LazyForgotPasswordScreen = lazy(() => import('../screens/auth/ForgotPasswordScreen'));
export const LazyDashboardScreen = lazy(() => import('../screens/main/DashboardScreen'));
export const LazyTrackingScreen = lazy(() => import('../screens/main/TrackingScreen'));
export const LazyIncidentsScreen = lazy(() => import('../screens/main/IncidentsScreen'));
export const LazyMessagesScreen = lazy(() => import('../screens/main/MessagesScreen'));
export const LazyProfileScreen = lazy(() => import('../screens/main/ProfileScreen'));
export const LazySettingsScreen = lazy(() => import('../screens/main/SettingsScreen'));
export const LazyCreateIncidentScreen = lazy(() => import('../screens/main/CreateIncidentScreen'));
export const LazyIncidentDetailScreen = lazy(() => import('../screens/main/IncidentDetailScreen'));


// Loading Component
const LoadingComponent: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

// Higher-Order Component for Lazy Loading
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  loadingMessage?: string
) => {
  const LazyComponent = (props: P) => (
    <Suspense fallback={<LoadingComponent message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  );
  
  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return LazyComponent;
};

// Performance Monitoring Hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
  });

  useEffect(() => {
    renderStartTime.current = Date.now();
    renderCount.current += 1;

    return () => {
      const renderTime = Date.now() - renderStartTime.current;
      const newMetrics = {
        renderCount: renderCount.current,
        averageRenderTime: (performanceMetrics.averageRenderTime + renderTime) / 2,
        lastRenderTime: renderTime,
      };
      
      setPerformanceMetrics(newMetrics);
      
      if (__DEV__) {
        console.log(`${componentName} Performance:`, newMetrics);
      }
    };
  });

  return performanceMetrics;
};

// Memory Usage Monitor
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (performance.memory) {
        setMemoryInfo({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

// Focus-based Performance Optimization
export const useFocusOptimization = () => {
  const [isFocused, setIsFocused] = useState(true);
  const [isBackgrounded, setIsBackgrounded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      setIsBackgrounded(false);
      
      return () => {
        setIsFocused(false);
        setIsBackgrounded(true);
      };
    }, [])
  );

  return { isFocused, isBackgrounded };
};

// Image Optimization Hook
export const useImageOptimization = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((uri: string) => {
    if (loadedImages.has(uri) || loadingImages.has(uri)) {
      return Promise.resolve();
    }

    setLoadingImages(prev => new Set(prev).add(uri));

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(uri));
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(uri);
          return newSet;
        });
        resolve();
      };
      img.onerror = reject;
      img.src = uri;
    });
  }, [loadedImages, loadingImages]);

  const isImageLoaded = useCallback((uri: string) => {
    return loadedImages.has(uri);
  }, [loadedImages]);

  const isImageLoading = useCallback((uri: string) => {
    return loadingImages.has(uri);
  }, [loadingImages]);

  return {
    preloadImage,
    isImageLoaded,
    isImageLoading,
    loadedImagesCount: loadedImages.size,
    loadingImagesCount: loadingImages.size,
  };
};

// List Performance Optimization
export const useListOptimization = <T>(
  data: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);

  const calculateVisibleRange = useCallback((offset: number) => {
    const start = Math.floor(offset / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + 1,
      data.length
    );
    
    setVisibleRange({ start, end });
  }, [data.length, itemHeight, containerHeight]);

  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    setScrollOffset(offset);
    calculateVisibleRange(offset);
  }, [calculateVisibleRange]);

  const visibleItems = data.slice(visibleRange.start, visibleRange.end);

  return {
    visibleItems,
    visibleRange,
    scrollOffset,
    handleScroll,
    totalHeight: data.length * itemHeight,
    offsetY: visibleRange.start * itemHeight,
  };
};

// Network Performance Monitor
export const useNetworkMonitor = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    isConnected: boolean;
    type: string;
    isInternetReachable: boolean;
  } | null>(null);

  useEffect(() => {
    // This would integrate with @react-native-community/netinfo
    // For now, we'll simulate the functionality
    const updateNetworkInfo = () => {
      setNetworkInfo({
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true,
      });
    };

    updateNetworkInfo();
    const interval = setInterval(updateNetworkInfo, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return networkInfo;
};

// Bundle Size Analyzer (Development Only)
export const useBundleAnalyzer = () => {
  useEffect(() => {
    if (__DEV__) {
      // This would integrate with bundle analysis tools
      console.log('Bundle Analysis:', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        memoryUsage: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        } : 'Not available',
      });
    }
  }, []);
};

// Performance Optimization Settings
export const PerformanceSettings = {
  // Image optimization
  imageCacheSize: 50, // MB
  imageQuality: 0.8,
  imageMaxWidth: 1920,
  imageMaxHeight: 1080,
  
  // List optimization
  listItemHeight: 60,
  listBufferSize: 5,
  listMaxRenderItems: 20,
  
  // Memory management
  maxCacheSize: 100, // MB
  cacheExpirationTime: 30 * 60 * 1000, // 30 minutes
  
  // Network optimization
  requestTimeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  
  // Animation optimization
  animationDuration: 300,
  animationEasing: 'ease-in-out',
  reduceMotion: false,
};

// Performance Utilities
export const PerformanceUtils = {
  // Debounce function calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function calls
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Measure function execution time
  measureTime: async <T>(func: () => Promise<T> | T): Promise<{ result: T; time: number }> => {
    const start = Date.now();
    const result = await func();
    const time = Date.now() - start;
    return { result, time };
  },

  // Batch operations
  batch: <T>(items: T[], batchSize: number): T[][] => {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  },
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default {
  withLazyLoading,
  usePerformanceMonitor,
  useMemoryMonitor,
  useFocusOptimization,
  useImageOptimization,
  useListOptimization,
  useNetworkMonitor,
  useBundleAnalyzer,
  PerformanceSettings,
  PerformanceUtils,
};

