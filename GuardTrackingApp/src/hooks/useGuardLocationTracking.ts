import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import locationTrackingService from '../services/locationTrackingService';
import WebSocketService from '../services/WebSocketService';
import { getAuthGuardId } from '../utils/getAuthGuardId';

/**
 * Keeps GPS + WebSocket location sync active while the guard has an IN_PROGRESS shift.
 */
export const useGuardLocationTracking = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const activeShift = useSelector((state: RootState) => state.shifts.activeShift);
  const trackingShiftIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'GUARD') return;

    const shouldTrack = activeShift?.status === 'IN_PROGRESS';
    const shiftId = shouldTrack ? activeShift?.id : null;

    if (shiftId && trackingShiftIdRef.current !== shiftId) {
      trackingShiftIdRef.current = shiftId;
      WebSocketService.connect();
      locationTrackingService.initialize().finally(() => {
        locationTrackingService.startTracking(shiftId);
      });
      return;
    }

    if (!shouldTrack && trackingShiftIdRef.current) {
      trackingShiftIdRef.current = null;
      locationTrackingService.stopTracking();
    }
  }, [user?.role, activeShift?.id, activeShift?.status]);

  return {
    guardId: getAuthGuardId(user),
    isTrackingShift: !!trackingShiftIdRef.current,
  };
};
