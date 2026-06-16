import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import apiService from '../services/api';
import {
  SubscriptionOverview,
  SubscriptionResource,
} from '../utils/subscriptionUtils';
import { showSubscriptionLimitAlert } from '../utils/subscriptionLimitAlert';

export const useSubscriptionLimits = (options?: { autoLoad?: boolean }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const role = user?.role;
  const enabled = role === 'ADMIN' || role === 'CLIENT';
  const autoLoad = options?.autoLoad !== false;

  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return null;

    setLoading(true);
    try {
      const response = await apiService.getSubscriptionOverview();
      if (response.success && response.data) {
        setOverview(response.data);
        return response.data as SubscriptionOverview;
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled && autoLoad) {
      refresh();
    }
  }, [enabled, autoLoad, refresh]);

  const canAdd = useCallback(
    (resource: SubscriptionResource): boolean => {
      const check = overview?.canAdd?.[resource];
      return check?.allowed !== false;
    },
    [overview]
  );

  const getBlockReason = useCallback(
    (resource: SubscriptionResource): string | undefined =>
      overview?.canAdd?.[resource]?.reason,
    [overview]
  );

  const ensureCanAdd = useCallback(
    async (
      resource: SubscriptionResource,
      navigation?: { navigate: (screen: string) => void }
    ): Promise<boolean> => {
      let current = overview;
      if (!current?.canAdd) {
        current = (await refresh()) ?? null;
      }

      const check = current?.canAdd?.[resource];
      if (check?.allowed !== false) {
        return true;
      }

      showSubscriptionLimitAlert(resource, check?.reason || 'Plan limit reached.', {
        role,
        onUpgrade:
          role === 'ADMIN' && navigation
            ? () => navigation.navigate('AdminSubscription')
            : undefined,
      });
      return false;
    },
    [overview, refresh, role]
  );

  return {
    overview,
    loading,
    refresh,
    canAdd,
    getBlockReason,
    ensureCanAdd,
    enabled,
  };
};
