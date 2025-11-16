import React from 'react';
import { InteractionManager, Dimensions } from 'react-native';
import { ErrorHandler } from './errorHandler';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  apiResponseTime: number;
  timestamp: string;
}

export class PerformanceOptimizer {
  private static metrics: PerformanceMetrics[] = [];
  private static renderStartTime: number = 0;
  private static apiStartTimes: Map<string, number> = new Map();

  /**
   * Start measuring render performance
   */
  static startRenderMeasurement() {
    this.renderStartTime = performance.now();
  }

  /**
   * End render measurement and log
   */
  static endRenderMeasurement(componentName: string) {
    if (this.renderStartTime === 0) return;
    
    const renderTime = performance.now() - this.renderStartTime;
    this.renderStartTime = 0;

    if (__DEV__) {
      console.log(`🎯 Render Performance - ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    // Log slow renders
    if (renderTime > 100) {
      ErrorHandler.handleError(
        new Error(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`),
        'performance_slow_render',
        false
      );
    }

    return renderTime;
  }

  /**
   * Start API call measurement
   */
  static startApiMeasurement(apiName: string) {
    this.apiStartTimes.set(apiName, performance.now());
  }

  /**
   * End API call measurement
   */
  static endApiMeasurement(apiName: string) {
    const startTime = this.apiStartTimes.get(apiName);
    if (!startTime) return;

    const responseTime = performance.now() - startTime;
    this.apiStartTimes.delete(apiName);

    if (__DEV__) {
      console.log(`🌐 API Performance - ${apiName}: ${responseTime.toFixed(2)}ms`);
    }

    // Log slow API calls
    if (responseTime > 3000) {
      ErrorHandler.handleError(
        new Error(`Slow API call detected: ${apiName} took ${responseTime.toFixed(2)}ms`),
        'performance_slow_api',
        false
      );
    }

    return responseTime;
  }

  /**
   * Measure memory usage
   */
  static measureMemoryUsage(): number {
    if (global.performance && global.performance.memory) {
      return global.performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Get device performance info
   */
  static getDeviceInfo() {
    const { width, height } = Dimensions.get('window');
    const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');
    
    return {
      screenDimensions: { width, height },
      windowDimensions: { width: screenWidth, height: screenHeight },
      pixelRatio: Dimensions.get('window').scale,
      fontScale: Dimensions.get('window').fontScale,
    };
  }

  /**
   * Optimize image loading based on device
   */
  static getOptimizedImageSize(originalWidth: number, originalHeight: number) {
    const { width: screenWidth } = Dimensions.get('window');
    const pixelRatio = Dimensions.get('window').scale;
    
    // Calculate optimal size based on screen density
    const maxWidth = screenWidth * pixelRatio;
    const aspectRatio = originalHeight / originalWidth;
    
    if (originalWidth <= maxWidth) {
      return { width: originalWidth, height: originalHeight };
    }
    
    return {
      width: maxWidth,
      height: maxWidth * aspectRatio,
    };
  }

  /**
   * Debounce function for performance optimization
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      const callNow = immediate && !timeout;
      
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        timeout = null;
        if (!immediate) func(...args);
      }, wait);
      
      if (callNow) func(...args);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Run after interactions for better performance
   */
  static runAfterInteractions<T>(callback: () => T): Promise<T> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve(callback());
      });
    });
  }

  /**
   * Batch operations for better performance
   */
  static batchOperations<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const results: T[] = [];
        
        for (let i = 0; i < operations.length; i += batchSize) {
          const batch = operations.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(op => op()));
          results.push(...batchResults);
          
          // Small delay between batches to prevent blocking
          if (i + batchSize < operations.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Lazy load component
   */
  static lazyLoad<T>(
    importFunction: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) {
    return React.lazy(() => 
      importFunction().catch(error => {
        ErrorHandler.handleError(error, 'lazy_load_component');
        // Return fallback component if available
        if (fallback) {
          return { default: fallback };
        }
        throw error;
      })
    );
  }

  /**
   * Optimize FlatList performance
   */
  static getFlatListOptimizations(itemCount: number) {
    const { height } = Dimensions.get('window');
    const estimatedItemHeight = 80; // Adjust based on your item height
    const windowSize = Math.ceil(height / estimatedItemHeight);
    
    return {
      windowSize: Math.max(windowSize, 10),
      initialNumToRender: Math.min(itemCount, 10),
      maxToRenderPerBatch: 5,
      updateCellsBatchingPeriod: 50,
      removeClippedSubviews: itemCount > 50,
      getItemLayout: (data: any, index: number) => ({
        length: estimatedItemHeight,
        offset: estimatedItemHeight * index,
        index,
      }),
    };
  }

  /**
   * Monitor app performance
   */
  static startPerformanceMonitoring() {
    if (__DEV__) {
      // Monitor memory usage periodically
      setInterval(() => {
        const memoryUsage = this.measureMemoryUsage();
        if (memoryUsage > 100) { // Alert if over 100MB
          console.warn(`⚠️ High memory usage: ${memoryUsage.toFixed(2)}MB`);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Get performance report
   */
  static getPerformanceReport() {
    const deviceInfo = this.getDeviceInfo();
    const memoryUsage = this.measureMemoryUsage();
    
    return {
      deviceInfo,
      memoryUsage,
      metricsCount: this.metrics.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear performance metrics
   */
  static clearMetrics() {
    this.metrics = [];
    this.apiStartTimes.clear();
  }
}

/**
 * Performance monitoring HOC
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return React.memo((props: P) => {
    React.useEffect(() => {
      PerformanceOptimizer.startRenderMeasurement();
      
      return () => {
        PerformanceOptimizer.endRenderMeasurement(
          componentName || WrappedComponent.name || 'Unknown'
        );
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  });
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitoring(componentName: string) {
  React.useEffect(() => {
    PerformanceOptimizer.startRenderMeasurement();
    
    return () => {
      PerformanceOptimizer.endRenderMeasurement(componentName);
    };
  }, [componentName]);

  const measureApiCall = React.useCallback((apiName: string) => {
    return {
      start: () => PerformanceOptimizer.startApiMeasurement(apiName),
      end: () => PerformanceOptimizer.endApiMeasurement(apiName),
    };
  }, []);

  return {
    measureApiCall,
    runAfterInteractions: PerformanceOptimizer.runAfterInteractions,
    debounce: PerformanceOptimizer.debounce,
    throttle: PerformanceOptimizer.throttle,
  };
}
