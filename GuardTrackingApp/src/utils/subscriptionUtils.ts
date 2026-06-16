/** Shared subscription display helpers (mirrors backend planLimits) */

export const PLAN_LIMITS_DISPLAY = {
  BASIC: { guards: 10, clients: 5, sites: 10 },
  PROFESSIONAL: { guards: 50, clients: 20, sites: 20 },
  ENTERPRISE: { guards: 500, clients: 100, sites: 100 },
  CUSTOM: { guards: 'Custom', clients: 'Custom', sites: 'Custom' },
} as const;

export const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  BASIC: [
    'Up to 10 guards',
    'Up to 5 clients',
    'Up to 10 sites',
    'GPS tracking & shifts',
    'Basic reports',
  ],
  PROFESSIONAL: [
    'Up to 50 guards',
    'Up to 20 clients & sites',
    'Advanced analytics',
    'Geofencing & alerts',
    'Priority support',
  ],
  ENTERPRISE: [
    'High-volume limits',
    'White-label options',
    'Dedicated support',
    'Custom integrations',
  ],
};

export interface UsageRow {
  used: number;
  max: number;
  percent: number;
}

export interface CanAddCheck {
  allowed: boolean;
  reason?: string;
}

export interface SubscriptionOverview {
  plan: string;
  status: string;
  displayPlan: string;
  isTrial: boolean;
  hasPaidSubscription: boolean;
  limits: { maxGuards: number; maxClients: number; maxSites: number };
  counts: { guardsCount: number; clientsCount: number; sitesCount: number };
  usage: {
    guards: UsageRow;
    clients: UsageRow;
    sites: UsageRow;
  };
  trialEndsAt: string | null;
  subscriptionEndDate: string | null;
  canUpgrade: boolean;
  planFeatures: string[];
  support: { email: string; billingEmail: string };
  canAdd?: {
    guards: CanAddCheck;
    clients: CanAddCheck;
    sites: CanAddCheck;
  };
}

export type SubscriptionResource = 'guards' | 'clients' | 'sites';

export function formatPlanPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatPlanDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function statusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return '#4CAF50';
    case 'TRIAL':
      return '#FF9800';
    case 'SUSPENDED':
      return '#F44336';
    default:
      return '#828282';
  }
}

export function usageLabel(row: UsageRow, singular: string, plural: string): string {
  return `${row.used} / ${row.max} ${row.max === 1 ? singular : plural}`;
}
