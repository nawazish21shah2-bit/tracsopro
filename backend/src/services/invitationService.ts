import prisma from '../config/database.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import subscriptionService from './subscriptionService.js';
import * as crypto from 'crypto';

interface CreateInvitationData {
  securityCompanyId: string;
  email?: string;
  role: 'GUARD' | 'CLIENT';
  expiresInDays?: number;
  maxUses?: number;
  createdBy: string;
}

interface ValidateInvitationResult {
  valid: boolean;
  invitation?: any;
  error?: string;
}

class InvitationService {
  /**
   * Generate unique invitation code
   */
  private generateInvitationCode(): string {
    return `INV-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  }

  /**
   * Create a new invitation
   */
  async createInvitation(data: CreateInvitationData) {
    const {
      securityCompanyId,
      email,
      role,
      expiresInDays = 7,
      maxUses = 1,
      createdBy,
    } = data;

    // Verify security company exists
    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
    });

    if (!company) {
      throw new NotFoundError('Security company not found');
    }

    // Verify creator is admin of this company
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        securityCompanyId,
        userId: createdBy,
        isActive: true,
      },
    });

    if (!companyUser) {
      throw new UnauthorizedError('Only company admins can create invitations');
    }

    // Free tier limit check before creating invitation
    if (role === 'GUARD') {
      await subscriptionService.validateGuardLimit(securityCompanyId);
    } else if (role === 'CLIENT') {
      await subscriptionService.validateClientLimit(securityCompanyId);
    }

    // Generate unique code
    let invitationCode = this.generateInvitationCode();
    let attempts = 0;
    while (await prisma.invitation.findUnique({ where: { invitationCode } })) {
      invitationCode = this.generateInvitationCode();
      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique invitation code');
      }
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        securityCompanyId,
        email: email?.toLowerCase() || null,
        role,
        invitationCode,
        expiresAt,
        maxUses,
        createdBy,
      },
      include: {
        securityCompany: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    logger.info(`Invitation created: ${invitationCode} for company ${securityCompanyId}`);
    return invitation;
  }

  /**
   * Validate invitation code
   */
  async validateInvitation(code: string, email?: string): Promise<ValidateInvitationResult> {
    const invitation = await prisma.invitation.findUnique({
      where: { invitationCode: code },
      include: {
        securityCompany: {
          select: { id: true, name: true, isActive: true },
        },
      },
    });

    if (!invitation) {
      return { valid: false, error: 'Invalid invitation code' };
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      return { valid: false, error: 'Invitation has expired' };
    }

    // Check if inactive
    if (!invitation.isActive) {
      return { valid: false, error: 'Invitation is no longer active' };
    }

    // Check if company is active
    if (!invitation.securityCompany.isActive) {
      return { valid: false, error: 'Company is not active' };
    }

    // Check if email-specific invitation
    if (invitation.email && email) {
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return { valid: false, error: 'This invitation is for a different email address' };
      }
    }

    // Check if max uses reached
    if (invitation.currentUses >= invitation.maxUses) {
      return { valid: false, error: 'Invitation has reached maximum uses' };
    }

    return { valid: true, invitation };
  }

  /**
   * Mark invitation as used
   */
  async markAsUsed(invitationId: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        usedAt: invitation.usedAt || new Date(),
        usedBy: userId,
        currentUses: { increment: 1 },
      },
    });
  }

  /**
   * Get invitations for a company
   */
  async getCompanyInvitations(securityCompanyId: string, filters?: {
    role?: 'GUARD' | 'CLIENT';
    isActive?: boolean;
    isUsed?: boolean;
  }) {
    const where: any = { securityCompanyId };

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isUsed !== undefined) {
      if (filters.isUsed) {
        where.usedAt = { isNot: null };
      } else {
        where.usedAt = null;
      }
    }

    return await prisma.invitation.findMany({
      where,
      include: {
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get invitation by ID
   */
  async getInvitationById(invitationId: string, securityCompanyId: string) {
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        securityCompanyId,
      },
      include: {
        securityCompany: {
          select: { id: true, name: true },
        },
        creator: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    return invitation;
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(invitationId: string, securityCompanyId: string) {
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        securityCompanyId,
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    return await prisma.invitation.update({
      where: { id: invitationId },
      data: { isActive: false },
    });
  }

  /**
   * Delete invitation
   */
  async deleteInvitation(invitationId: string, securityCompanyId: string) {
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        securityCompanyId,
      },
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    return await prisma.invitation.delete({
      where: { id: invitationId },
    });
  }
}

export default new InvitationService();

