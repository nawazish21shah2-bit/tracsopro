import { useCallback, useState } from 'react';
import { shiftApi } from '../../../services/api/shiftApi';
import locationValidationService from '../../../services/locationValidationService';

export interface ShiftCheckLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export function useCheckInOut() {
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIn = useCallback(async (shiftId: string, location?: ShiftCheckLocation) => {
    setCheckInLoading(true);
    setError(null);
    try {
      const loc = location ?? (await locationValidationService.getCurrentLocation());
      const response = await shiftApi.checkInToShift(shiftId, {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy ?? 0,
        address: loc.address,
      });
      if (!response.success) {
        throw new Error(response.message || 'Check-in failed');
      }
      return response.data;
    } catch (e: any) {
      setError(e.message || 'Check-in failed');
      throw e;
    } finally {
      setCheckInLoading(false);
    }
  }, []);

  const checkOut = useCallback(async (shiftId: string, notes?: string, location?: ShiftCheckLocation) => {
    setCheckOutLoading(true);
    setError(null);
    try {
      const loc = location ?? (await locationValidationService.getCurrentLocation());
      const response = await shiftApi.checkOutFromShift(
        shiftId,
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy ?? 0,
          address: loc.address,
        },
        notes,
      );
      if (!response.success) {
        throw new Error(response.message || 'Check-out failed');
      }
      return response.data;
    } catch (e: any) {
      setError(e.message || 'Check-out failed');
      throw e;
    } finally {
      setCheckOutLoading(false);
    }
  }, []);

  return {
    checkIn,
    checkOut,
    checkInLoading,
    checkOutLoading,
    submitting: checkInLoading || checkOutLoading,
    error,
  };
}
