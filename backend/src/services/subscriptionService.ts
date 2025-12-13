/**
 * Subscription Service
 * Handles free tier limits and subscription management
 */

import prisma from '../config/database.js';
import { ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export interface SubscriptionLimits {
  maxGuards: number;
  maxClients: number;
  maxSites: number;
}

export interface ResourceCounts {
  guardsCount: number;
  clientsCount: number;
  sitesCount: number;
}

class SubscriptionService {
  /**
   * Get free tier limits
   */
  getFreeTierLimits(): SubscriptionLimits {
    return {
      maxGuards: 2,
      maxClients: 1,
      maxSites: 1,
    };
  }

  /**
   * Get current resource counts for a company
   */
  async getResourceCounts(securityCompanyId: string): Promise<ResourceCounts> {
    const [guardsCount, clientsCount, sitesCount] = await Promise.all([
      prisma.companyGuard.count({
        where: {
          securityCompanyId,
          isActive: true,
        },
      }),
      prisma.companyClient.count({
        where: {
          securityCompanyId,
          isActive: true,
        },
      }),
      prisma.companySite.count({
        where: {
          securityCompanyId,
        },
      }),
    ]);

    return {
      guardsCount,
      clientsCount,
      sitesCount,
    };
  }

  /**
   * Check if company can add a guard
   */
  async canAddGuard(securityCompanyId: string): Promise<{ allowed: boolean; reason?: string }> {
    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
      select: {
        subscriptionPlan: true,
        maxGuards: true,
      },
    });

    if (!company) {
      return { allowed: false, reason: 'Company not found' };
    }

    // Check if it's free tier
    const isFreeTier = company.subscriptionPlan === 'BASIC' || company.maxGuards <= 2;
    const limits = isFreeTier ? this.getFreeTierLimits() : { maxGuards: company.maxGuards };

    const counts = await this.getResourceCounts(securityCompanyId);

    if (counts.guardsCount >= limits.maxGuards) {
      return {
        allowed: false,
        reason: `Free tier limit reached. You can add up to ${limits.maxGuards} guards. Please upgrade to add more.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if company can add a client
   */
  async canAddClient(securityCompanyId: string): Promise<{ allowed: boolean; reason?: string }> {
    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
      select: {
        subscriptionPlan: true,
        maxClients: true,
      },
    });

    if (!company) {
      return { allowed: false, reason: 'Company not found' };
    }

    // Check if it's free tier
    const isFreeTier = company.subscriptionPlan === 'BASIC' || company.maxClients <= 1;
    const limits = isFreeTier ? this.getFreeTierLimits() : { maxClients: company.maxClients };

    const counts = await this.getResourceCounts(securityCompanyId);

    if (counts.clientsCount >= limits.maxClients) {
      return {
        allowed: false,
        reason: `Free tier limit reached. You can add up to ${limits.maxClients} client. Please upgrade to add more.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if company can add a site
   */
  async canAddSite(securityCompanyId: string): Promise<{ allowed: boolean; reason?: string }> {
    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
      select: {
        subscriptionPlan: true,
        maxSites: true,
      },
    });

    if (!company) {
      return { allowed: false, reason: 'Company not found' };
    }

    // Check if it's free tier
    const isFreeTier = company.subscriptionPlan === 'BASIC' || company.maxSites <= 1;
    const limits = isFreeTier ? this.getFreeTierLimits() : { maxSites: company.maxSites };

    const counts = await this.getResourceCounts(securityCompanyId);

    if (counts.sitesCount >= limits.maxSites) {
      return {
        allowed: false,
        reason: `Free tier limit reached. You can add up to ${limits.maxSites} site. Please upgrade to add more.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Validate and throw if limit reached
   */
  async validateGuardLimit(securityCompanyId: string): Promise<void> {
    const check = await this.canAddGuard(securityCompanyId);
    if (!check.allowed) {
      throw new ValidationError(check.reason || 'Guard limit reached');
    }
  }

  /**
   * Validate and throw if limit reached
   */
  async validateClientLimit(securityCompanyId: string): Promise<void> {
    const check = await this.canAddClient(securityCompanyId);
    if (!check.allowed) {
      throw new ValidationError(check.reason || 'Client limit reached');
    }
  }

  /**
   * Validate and throw if limit reached
   */
  async validateSiteLimit(securityCompanyId: string): Promise<void> {
    const check = await this.canAddSite(securityCompanyId);
    if (!check.allowed) {
      throw new ValidationError(check.reason || 'Site limit reached');
    }
  }

  /**
   * Get subscription info for a company
   */
  async getSubscriptionInfo(securityCompanyId: string) {
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

    const counts = await this.getResourceCounts(securityCompanyId);
    const isFreeTier = company.subscriptionPlan === 'BASIC';
    const limits = isFreeTier ? this.getFreeTierLimits() : {
      maxGuards: company.maxGuards,
      maxClients: company.maxClients,
      maxSites: company.maxSites,
    };

    return {
      plan: company.subscriptionPlan,
      status: company.subscriptionStatus,
      limits,
      counts,
      isFreeTier,
      canUpgrade: isFreeTier && (
        counts.guardsCount >= limits.maxGuards ||
        counts.clientsCount >= limits.maxClients ||
        counts.sitesCount >= limits.maxSites
      ),
    };
  }
}

export default new SubscriptionService();

