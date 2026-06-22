/**
 * Subscription Service — trial vs paid plan limits and usage
 */

import prisma from '../config/database.js';
import { ValidationError } from '../utils/errors.js';
import {
  TRIAL_LIMITS,
  TRIAL_DAYS_DEFAULT,
  getLimitsForPlan,
  getDisplayPlanLabel,
  PLAN_FEATURES,
  SUPPORT_CONTACT,
  type PlanLimits,
} from '../utils/planLimits.js';
import { usageRow } from '../utils/usageMetrics.js';
import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export interface ResourceCounts {
  guardsCount: number;
  clientsCount: number;
  sitesCount: number;
}

export interface SubscriptionOverview {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  displayPlan: string;
  isTrial: boolean;
  hasPaidSubscription: boolean;
  limits: PlanLimits;
  counts: ResourceCounts;
  usage: {
    guards: { used: number; max: number; percent: number };
    clients: { used: number; max: number; percent: number };
    sites: { used: number; max: number; percent: number };
  };
  trialEndsAt: string | null;
  subscriptionEndDate: string | null;
  canUpgrade: boolean;
  planFeatures: string[];
  support: typeof SUPPORT_CONTACT;
  company: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  canAdd: {
    guards: { allowed: boolean; reason?: string };
    clients: { allowed: boolean; reason?: string };
    sites: { allowed: boolean; reason?: string };
  };
}

class SubscriptionService {
  getTrialLimits(): PlanLimits {
    return { ...TRIAL_LIMITS };
  }

  async getResourceCounts(securityCompanyId: string): Promise<ResourceCounts> {
    const [guardsCount, clientsCount, sitesCount] = await Promise.all([
      prisma.companyGuard.count({
        where: { securityCompanyId, isActive: true },
      }),
      prisma.companyClient.count({
        where: { securityCompanyId, isActive: true },
      }),
      prisma.companySite.count({
        where: { securityCompanyId },
      }),
    ]);

    return { guardsCount, clientsCount, sitesCount };
  }

  async hasPaidSubscription(securityCompanyId: string): Promise<boolean> {
    const active = await prisma.subscription.findFirst({
      where: {
        securityCompanyId,
        isActive: true,
        stripeSubscriptionId: { not: null },
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
      select: { id: true },
    });
    return Boolean(active);
  }

  async getEffectiveLimits(
    securityCompanyId: string
  ): Promise<{ limits: PlanLimits; isTrial: boolean; plan: SubscriptionPlan; status: SubscriptionStatus }> {
    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        maxGuards: true,
        maxClients: true,
        maxSites: true,
      },
    });

    if (!company) {
      throw new ValidationError('Company not found');
    }

    const paid = await this.hasPaidSubscription(securityCompanyId);
    const onTrial = !paid;

    if (onTrial) {
      return {
        limits: this.getTrialLimits(),
        isTrial: true,
        plan: company.subscriptionPlan,
        status: company.subscriptionStatus,
      };
    }

    const planLimits = getLimitsForPlan(company.subscriptionPlan);
    return {
      limits: {
        maxGuards: company.maxGuards || planLimits.maxGuards,
        maxClients: company.maxClients || planLimits.maxClients,
        maxSites: company.maxSites || planLimits.maxSites,
      },
      isTrial: false,
      plan: company.subscriptionPlan,
      status: company.subscriptionStatus,
    };
  }

  async getSubscriptionInfo(securityCompanyId: string): Promise<SubscriptionOverview> {
    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        maxGuards: true,
        maxClients: true,
        maxSites: true,
      },
    });

    if (!company) {
      throw new ValidationError('Company not found');
    }

    const counts = await this.getResourceCounts(securityCompanyId);
    const paid = await this.hasPaidSubscription(securityCompanyId);
    const onTrial = !paid;
    const { limits } = await this.getEffectiveLimits(securityCompanyId);

    const atLimit =
      counts.guardsCount >= limits.maxGuards ||
      counts.clientsCount >= limits.maxClients ||
      counts.sitesCount >= limits.maxSites;

    return {
      plan: company.subscriptionPlan,
      status: company.subscriptionStatus,
      displayPlan: paid
        ? getDisplayPlanLabel(company.subscriptionPlan, company.subscriptionStatus, true)
        : 'Free Trial',
      isTrial: onTrial,
      hasPaidSubscription: paid,
      limits,
      counts,
      usage: {
        guards: usageRow(counts.guardsCount, limits.maxGuards),
        clients: usageRow(counts.clientsCount, limits.maxClients),
        sites: usageRow(counts.sitesCount, limits.maxSites),
      },
      trialEndsAt: company.subscriptionEndDate?.toISOString() ?? null,
      subscriptionEndDate: company.subscriptionEndDate?.toISOString() ?? null,
      canUpgrade: onTrial || atLimit || !paid,
      planFeatures: onTrial
        ? [
            `${TRIAL_LIMITS.maxGuards} guards`,
            `${TRIAL_LIMITS.maxClients} client`,
            `${TRIAL_LIMITS.maxSites} site`,
            `${TRIAL_DAYS_DEFAULT}-day trial — upgrade for more`,
          ]
        : PLAN_FEATURES[company.subscriptionPlan]?.highlights ?? [],
      support: SUPPORT_CONTACT,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
      },
      canAdd: {
        guards: await this.canAddGuard(securityCompanyId),
        clients: await this.canAddClient(securityCompanyId),
        sites: await this.canAddSite(securityCompanyId),
      },
    };
  }

  async canAddGuard(securityCompanyId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { limits, isTrial } = await this.getEffectiveLimits(securityCompanyId);
    const counts = await this.getResourceCounts(securityCompanyId);

    if (counts.guardsCount >= limits.maxGuards) {
      return {
        allowed: false,
        reason: isTrial
          ? `Trial limit reached (${limits.maxGuards} guards). Upgrade your plan in Settings → Subscription & Billing.`
          : `Guard limit reached (${limits.maxGuards}). Upgrade your plan to add more guards.`,
      };
    }
    return { allowed: true };
  }

  async canAddClient(securityCompanyId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { limits, isTrial } = await this.getEffectiveLimits(securityCompanyId);
    const counts = await this.getResourceCounts(securityCompanyId);

    if (counts.clientsCount >= limits.maxClients) {
      return {
        allowed: false,
        reason: isTrial
          ? `Trial limit reached (${limits.maxClients} client). Upgrade your plan in Settings → Subscription & Billing.`
          : `Client limit reached (${limits.maxClients}). Upgrade your plan to add more clients.`,
      };
    }
    return { allowed: true };
  }

  async canAddSite(securityCompanyId: string): Promise<{ allowed: boolean; reason?: string }> {
    const { limits, isTrial } = await this.getEffectiveLimits(securityCompanyId);
    const counts = await this.getResourceCounts(securityCompanyId);

    if (counts.sitesCount >= limits.maxSites) {
      return {
        allowed: false,
        reason: isTrial
          ? `Trial limit reached (${limits.maxSites} site). Upgrade your plan in Settings → Subscription & Billing.`
          : `Site limit reached (${limits.maxSites}). Upgrade your plan to add more sites.`,
      };
    }
    return { allowed: true };
  }

  async validateGuardLimit(securityCompanyId: string): Promise<void> {
    const check = await this.canAddGuard(securityCompanyId);
    if (!check.allowed) throw new ValidationError(check.reason || 'Guard limit reached');
  }

  async validateClientLimit(securityCompanyId: string): Promise<void> {
    const check = await this.canAddClient(securityCompanyId);
    if (!check.allowed) throw new ValidationError(check.reason || 'Client limit reached');
  }

  async validateSiteLimit(securityCompanyId: string): Promise<void> {
    const check = await this.canAddSite(securityCompanyId);
    if (!check.allowed) throw new ValidationError(check.reason || 'Site limit reached');
  }

  /** Apply paid plan limits after Stripe checkout / webhook */
  async activatePaidPlan(
    securityCompanyId: string,
    plan: SubscriptionPlan,
    opts: {
      stripeSubscriptionId: string;
      amount: number;
      billingCycle: 'MONTHLY' | 'YEARLY';
      endDate?: Date | null;
    }
  ) {
    const limits = getLimitsForPlan(plan);

    await prisma.$transaction(async (tx) => {
      await tx.securityCompany.update({
        where: { id: securityCompanyId },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: 'ACTIVE',
          subscriptionStartDate: new Date(),
          subscriptionEndDate: opts.endDate ?? null,
          maxGuards: limits.maxGuards,
          maxClients: limits.maxClients,
          maxSites: limits.maxSites,
        },
      });

      await tx.subscription.updateMany({
        where: { securityCompanyId, isActive: true },
        data: { isActive: false },
      });

      await tx.subscription.create({
        data: {
          securityCompanyId,
          plan,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: opts.endDate ?? null,
          amount: opts.amount,
          billingCycle: opts.billingCycle,
          stripeSubscriptionId: opts.stripeSubscriptionId,
          isActive: true,
        },
      });
    });
  }
}

export default new SubscriptionService();
