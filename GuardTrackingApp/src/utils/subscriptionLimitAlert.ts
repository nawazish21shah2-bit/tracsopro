import { Alert } from 'react-native';
import { SubscriptionResource } from './subscriptionUtils';
import { extractErrorMessage } from './errorHandler';

const RESOURCE_LABELS: Record<SubscriptionResource, string> = {
  guards: 'guard',
  clients: 'client',
  sites: 'site',
};

export function isSubscriptionLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('limit reached') ||
    lower.includes('trial limit') ||
    lower.includes('upgrade your plan')
  );
}

export function showSubscriptionLimitAlert(
  resource: SubscriptionResource,
  reason: string,
  options?: {
    role?: string;
    onUpgrade?: () => void;
  }
) {
  const isAdmin = options?.role === 'ADMIN';
  const buttons: Array<{ text: string; style?: 'cancel' | 'default'; onPress?: () => void }> = [
    { text: 'OK', style: 'cancel' },
  ];

  if (isAdmin && options?.onUpgrade) {
    buttons.unshift({
      text: 'Upgrade Plan',
      onPress: options.onUpgrade,
    });
  } else if (!isAdmin) {
    reason = `${reason}\n\nContact your security company admin to upgrade the plan.`;
  }

  Alert.alert('Plan Limit Reached', reason, buttons);
}

export function showActionErrorAlert(
  actionLabel: string,
  error: unknown,
  options?: {
    role?: string;
    resource?: SubscriptionResource;
    onUpgrade?: () => void;
  }
) {
  const message =
    typeof error === 'string'
      ? error
      : extractErrorMessage(error);

  if (isSubscriptionLimitError(message)) {
    showSubscriptionLimitAlert(options?.resource ?? 'sites', message, options);
    return;
  }

  Alert.alert(`Could Not ${actionLabel}`, message);
}

export function resourceLabel(resource: SubscriptionResource): string {
  return RESOURCE_LABELS[resource];
}
