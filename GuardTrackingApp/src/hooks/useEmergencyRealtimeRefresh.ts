import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

/** Re-run loader when any party acknowledges or resolves an emergency. */
export function useEmergencyRealtimeRefresh(onRefresh: () => void): void {
  const lastRealtimeUpdate = useSelector(
    (state: RootState) => state.emergency.lastRealtimeUpdate,
  );

  useEffect(() => {
    if (lastRealtimeUpdate) {
      onRefresh();
    }
  }, [lastRealtimeUpdate, onRefresh]);
}
