/** Mirrors backend/src/utils/planLimits.ts */
export type SubscriptionPlanKey = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';

export interface PlanLimits {
  maxGuards: number;
  maxClients: number;
  maxSites: number;
}

export const PLAN_LIMITS: Record<SubscriptionPlanKey, PlanLimits> = {
  BASIC: { maxGuards: 10, maxClients: 5, maxSites: 10 },
  PROFESSIONAL: { maxGuards: 50, maxClients: 20, maxSites: 20 },
  ENTERPRISE: { maxGuards: 500, maxClients: 100, maxSites: 100 },
  CUSTOM: { maxGuards: 999, maxClients: 999, maxSites: 999 },
};

/** Super-admin custom plan ceiling (aligned with backend CUSTOM defaults) */
export const CUSTOM_PLAN_MAX: PlanLimits = {
  maxGuards: 999,
  maxClients: 999,
  maxSites: 999,
};

export const CUSTOM_PLAN_MIN = 1;

export const SUBSCRIPTION_PLANS: SubscriptionPlanKey[] = [
  'BASIC',
  'PROFESSIONAL',
  'ENTERPRISE',
  'CUSTOM',
];

export function formatPlanLabel(plan: SubscriptionPlanKey): string {
  if (plan === 'CUSTOM') return 'Custom';
  return plan.charAt(0) + plan.slice(1).toLowerCase();
}

export function getLimitsForPlan(plan: SubscriptionPlanKey): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.BASIC;
}

export function isCustomPlan(plan: string): boolean {
  return plan === 'CUSTOM';
}

export function limitsToFormStrings(limits: PlanLimits): {
  maxGuards: string;
  maxClients: string;
  maxSites: string;
} {
  return {
    maxGuards: String(limits.maxGuards),
    maxClients: String(limits.maxClients),
    maxSites: String(limits.maxSites),
  };
}

export function applyPlanSelection(plan: SubscriptionPlanKey): {
  subscriptionPlan: SubscriptionPlanKey;
  maxGuards: string;
  maxClients: string;
  maxSites: string;
} {
  const limits = getLimitsForPlan(plan);
  return {
    subscriptionPlan: plan,
    ...limitsToFormStrings(limits),
  };
}

export function clampCustomLimit(
  field: keyof PlanLimits,
  rawValue: string,
): string {
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  const max = CUSTOM_PLAN_MAX[field];
  return String(Math.min(Math.max(num, CUSTOM_PLAN_MIN), max));
}

export function parseLimitFields(
  maxGuards: string,
  maxClients: string,
  maxSites: string,
  plan: SubscriptionPlanKey,
): { ok: true; limits: PlanLimits } | { ok: false; message: string } {
  if (!isCustomPlan(plan)) {
    return { ok: true, limits: getLimitsForPlan(plan) };
  }

  const guards = parseInt(maxGuards, 10);
  const clients = parseInt(maxClients, 10);
  const sites = parseInt(maxSites, 10);

  if (!guards || !clients || !sites) {
    return { ok: false, message: 'Enter valid limits for guards, clients, and sites' };
  }

  if (
    guards < CUSTOM_PLAN_MIN ||
    clients < CUSTOM_PLAN_MIN ||
    sites < CUSTOM_PLAN_MIN
  ) {
    return { ok: false, message: `Custom limits must be at least ${CUSTOM_PLAN_MIN}` };
  }

  if (
    guards > CUSTOM_PLAN_MAX.maxGuards ||
    clients > CUSTOM_PLAN_MAX.maxClients ||
    sites > CUSTOM_PLAN_MAX.maxSites
  ) {
    return {
      ok: false,
      message: `Custom limits cannot exceed ${CUSTOM_PLAN_MAX.maxGuards} guards, ${CUSTOM_PLAN_MAX.maxClients} clients, or ${CUSTOM_PLAN_MAX.maxSites} sites`,
    };
  }

  return { ok: true, limits: { maxGuards: guards, maxClients: clients, maxSites: sites } };
}
