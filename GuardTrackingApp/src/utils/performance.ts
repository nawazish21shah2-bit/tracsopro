// Performance Optimization Utilities
import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Custom hook for debouncing values
 * Useful for search inputs, API calls, etc.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling function calls
 * Useful for scroll events, resize events, etc.
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Custom hook for memoizing expensive calculations
 * with dependency tracking
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Custom hook for creating stable callback references
 * Prevents unnecessary re-renders in child components
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Custom hook for managing component visibility
 * React Native compatible version
 */
export function useVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const ref = useRef<any>(null);

  // In React Native, we assume components are visible by default
  // This can be enhanced with react-native-super-grid or similar libraries
  return { ref, isVisible };
}

/**
 * Custom hook for managing component mounting state
 * Useful for preventing state updates on unmounted components
 */
export function useIsMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Custom hook for managing component focus state
 * React Native compatible version
 */
export function useFocus() {
  const [isFocused, setIsFocused] = useState(true);

  // In React Native, we assume the app is focused by default
  // This can be enhanced with react-native-app-state
  return isFocused;
}

/**
 * Custom hook for managing component memory usage
 * Automatically cleans up resources when component unmounts
 */
export function useCleanup() {
  const cleanupFunctions = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, []);

  return addCleanup;
}

/**
 * Custom hook for managing component state with persistence
 * React Native compatible version using AsyncStorage
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(defaultValue);

  const setPersistedState = useCallback(
    (value: T) => {
      try {
        setState(value);
        // In React Native, you would use AsyncStorage here
        // AsyncStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error persisting state:', error);
      }
    },
    [key]
  );

  return [state, setPersistedState];
}

/**
 * Custom hook for managing component performance metrics
 * React Native compatible version
 */
export function usePerformanceMetrics(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = Date.now();
    renderCount.current += 1;

    return () => {
      const renderTime = Date.now() - renderStartTime.current;
      
      if (__DEV__) {
        console.log(`${componentName} render #${renderCount.current}: ${renderTime}ms`);
      }
    };
  });

  return {
    renderCount: renderCount.current,
    getRenderTime: () => Date.now() - renderStartTime.current,
  };
}

export default {
  useDebounce,
  useThrottle,
  useMemoizedValue,
  useStableCallback,
  useVisibility,
  useIsMounted,
  useFocus,
  useCleanup,
  usePersistedState,
  usePerformanceMetrics,
};
