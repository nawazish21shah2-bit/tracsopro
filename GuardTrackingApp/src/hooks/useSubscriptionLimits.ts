import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { adminApi } from '../services/api/adminApi';
import {
  SubscriptionOverview,
  SubscriptionResource,
} from '../utils/subscriptionUtils';
import { showSubscriptionLimitAlert, resourceLabel } from '../utils/subscriptionLimitAlert';

function getLimitReason(
  resource: SubscriptionResource,
  data: SubscriptionOverview | null
): string | undefined {
  const check = data?.canAdd?.[resource];
  if (check?.reason) {
    return check.reason;
  }

  const usage =
    resource === 'guards'
      ? data?.usage.guards
      : resource === 'clients'
        ? data?.usage.clients
        : data?.usage.sites;

  if (!usage || usage.max <= 0 || usage.used < usage.max) {
    return undefined;
  }

  return data?.isTrial
    ? `Trial limit reached (${usage.max} ${resourceLabel(resource)}). Upgrade your plan in Settings → Subscription & Billing.`
    : `${resourceLabel(resource).charAt(0).toUpperCase() + resourceLabel(resource).slice(1)} limit reached (${usage.max}). Upgrade your plan to add more.`;
}

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
      const response = await adminApi.getSubscriptionOverview();
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

  const isAtResourceLimit = useCallback(
    (resource: SubscriptionResource, data: SubscriptionOverview | null): boolean => {
      const check = data?.canAdd?.[resource];
      if (check?.allowed === false) {
        return true;
      }

      const usage =
        resource === 'guards'
          ? data?.usage.guards
          : resource === 'clients'
            ? data?.usage.clients
            : data?.usage.sites;

      return Boolean(usage && usage.max > 0 && usage.used >= usage.max);
    },
    []
  );

  const canAdd = useCallback(
    (resource: SubscriptionResource): boolean => !isAtResourceLimit(resource, overview),
    [overview, isAtResourceLimit]
  );

  const getBlockReason = useCallback(
    (resource: SubscriptionResource): string | undefined => {
      if (!isAtResourceLimit(resource, overview)) {
        return undefined;
      }
      return getLimitReason(resource, overview) || 'Plan limit reached.';
    },
    [overview, isAtResourceLimit]
  );

  const ensureCanAdd = useCallback(
    async (
      resource: SubscriptionResource,
      navigation?: { navigate: (screen: string) => void }
    ): Promise<boolean> => {
      const current = (await refresh()) ?? overview;

      const blocked = isAtResourceLimit(resource, current);
      if (!blocked) {
        return true;
      }

      const reason = getLimitReason(resource, current) || 'Plan limit reached.';

      showSubscriptionLimitAlert(resource, reason, {
        role,
        onUpgrade:
          role === 'ADMIN' && navigation
            ? () => navigation.navigate('AdminSubscription')
            : undefined,
      });
      return false;
    },
    [overview, refresh, role, isAtResourceLimit]
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
