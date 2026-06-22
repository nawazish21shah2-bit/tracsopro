import { useCallback, useEffect, useState } from 'react';
import { shiftApi } from '../../../services/api/shiftApi';
import { transformAdminShifts } from '../utils/transformShifts';

export interface ScheduledShiftItem {
  id: string;
  guardId?: string | null;
  guardName?: string;
  siteId: string;
  siteName: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  shiftType?: 'regular' | 'overtime' | 'emergency' | 'replacement';
  notes?: string;
  clientName?: string;
  isClientCreated?: boolean;
  conflicts?: Array<{ type: string; message: string; severity: string }>;
}

export function useShiftScheduling(selectedDate?: string) {
  const [shifts, setShifts] = useState<ScheduledShiftItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const date = selectedDate || new Date().toISOString().split('T')[0];
      const response = await shiftApi.getAdminShifts(date);
      if (response.success) {
        const raw = Array.isArray(response.data) ? response.data : [];
        setShifts(transformAdminShifts(raw, date));
      } else {
        setShifts([]);
        setError(response.message || 'Failed to load shifts');
      }
    } catch (e: any) {
      setShifts([]);
      setError(e.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return { shifts, loading, error, refresh: fetchShifts, setShifts };
}
