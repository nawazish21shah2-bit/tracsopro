import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchGuardReports } from '../store/slices/shiftReportSlice';
import apiService from '../services/api';
import {
  UnifiedReportItem,
  mergeReports,
  normalizeIncidentReport,
} from '../utils/reportUtils';

interface UseGuardReportsFeedResult {
  reports: UnifiedReportItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useGuardReportsFeed(limit = 50): UseGuardReportsFeedResult {
  const dispatch = useDispatch();
  const { reports: shiftReports, loading: shiftLoading, error: shiftError } = useSelector(
    (state: RootState) => state.shiftReports
  );
  const [incidentReports, setIncidentReports] = useState<any[]>([]);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);

  const loadIncidentReports = useCallback(async () => {
    setIncidentLoading(true);
    setIncidentError(null);
    try {
      const response = await apiService.getGuardIncidentReports(1, limit);
      if (response.success && response.data?.reports) {
        setIncidentReports(response.data.reports);
      } else {
        setIncidentReports([]);
        setIncidentError(response.message || 'Failed to load incident reports');
      }
    } catch (err: any) {
      setIncidentReports([]);
      setIncidentError(err.message || 'Failed to load incident reports');
    } finally {
      setIncidentLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(async () => {
    await Promise.all([
      dispatch(fetchGuardReports(limit) as any),
      loadIncidentReports(),
    ]);
  }, [dispatch, limit, loadIncidentReports]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const reports = mergeReports(shiftReports, incidentReports);

  return {
    reports,
    loading: shiftLoading || incidentLoading,
    error: shiftError || incidentError,
    refresh,
  };
}

export function toIncidentDetailReport(item: UnifiedReportItem) {
  if (item.source === 'incident') {
    return item.raw;
  }

  return {
    id: item.id,
    reportType: item.reportType,
    description: item.description,
    status: item.status || 'SUBMITTED',
    submittedAt: item.submittedAt,
    createdAt: item.submittedAt,
    content: item.description,
    location: {
      name: item.locationName,
      address: item.locationAddress,
    },
    statusHistory: item.statusHistory || [],
  };
}

export { normalizeIncidentReport };
