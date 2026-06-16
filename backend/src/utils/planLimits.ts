import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export interface PlanLimits {
  maxGuards: number;
  maxClients: number;
  maxSites: number;
}

export const TRIAL_LIMITS: PlanLimits = {
  maxGuards: 2,
  maxClients: 1,
  maxSites: 1,
};

export const TRIAL_DAYS_DEFAULT = 14;

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  BASIC: { maxGuards: 10, maxClients: 5, maxSites: 10 },
  PROFESSIONAL: { maxGuards: 50, maxClients: 20, maxSites: 20 },
  ENTERPRISE: { maxGuards: 500, maxClients: 100, maxSites: 100 },
  CUSTOM: { maxGuards: 999, maxClients: 999, maxSites: 999 },
};

export const PLAN_FEATURES: Record<
  SubscriptionPlan,
  { label: string; highlights: string[] }
> = {
  BASIC: {
    label: 'Basic Plan',
    highlights: [
      'Up to 10 guards',
      'Up to 5 clients',
      'Up to 10 sites',
      'GPS tracking & shift scheduling',
      'Basic reports',
    ],
  },
  PROFESSIONAL: {
    label: 'Professional Plan',
    highlights: [
      'Up to 50 guards',
      'Up to 20 clients & sites',
      'Advanced analytics',
      'Geofencing & emergency alerts',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    label: 'Enterprise Plan',
    highlights: [
      'High-volume guard & site limits',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantees',
    ],
  },
  CUSTOM: {
    label: 'Custom Plan',
    highlights: ['Tailored limits', 'Custom billing', 'Dedicated account manager'],
  },
};

const PRICE_TO_PLAN: Array<{ envKey: string; plan: SubscriptionPlan }> = [
  { envKey: 'STRIPE_PRICE_BASIC_MONTHLY', plan: 'BASIC' },
  { envKey: 'STRIPE_PRICE_BASIC_YEARLY', plan: 'BASIC' },
  { envKey: 'STRIPE_PRICE_PROF_MONTHLY', plan: 'PROFESSIONAL' },
  { envKey: 'STRIPE_PRICE_PROF_YEARLY', plan: 'PROFESSIONAL' },
  { envKey: 'STRIPE_PRICE_ENTERPRISE_MONTHLY', plan: 'ENTERPRISE' },
  { envKey: 'STRIPE_PRICE_ENTERPRISE_YEARLY', plan: 'ENTERPRISE' },
];

export function planFromStripePriceId(priceId?: string | null): SubscriptionPlan | null {
  if (!priceId) return null;
  for (const entry of PRICE_TO_PLAN) {
    if (process.env[entry.envKey] === priceId) {
      return entry.plan;
    }
  }
  const lower = priceId.toLowerCase();
  if (lower.includes('enterprise')) return 'ENTERPRISE';
  if (lower.includes('prof')) return 'PROFESSIONAL';
  if (lower.includes('basic')) return 'BASIC';
  return null;
}

export function getLimitsForPlan(plan: SubscriptionPlan): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.BASIC;
}

export function isTrialStatus(status: SubscriptionStatus): boolean {
  return status === 'TRIAL';
}

export function getDisplayPlanLabel(
  plan: SubscriptionPlan,
  status: SubscriptionStatus,
  hasPaidSubscription: boolean
): string {
  if (!hasPaidSubscription && isTrialStatus(status)) {
    return 'Free Trial';
  }
  return PLAN_FEATURES[plan]?.label ?? plan;
}

export const SUPPORT_CONTACT = {
  email: process.env.SUPPORT_EMAIL || 'support@tracsopro.com',
  billingEmail: process.env.BILLING_EMAIL || 'billing@tracsopro.com',
};
