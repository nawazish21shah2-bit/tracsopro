import { Request, Response } from 'express';
import invitationService from '../services/invitationService.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../middleware/auth.js';

export const createInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const securityCompanyId = req.securityCompanyId;
    const { email, role, expiresInDays, maxUses } = req.body;

    if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        error: 'Security company ID not found. Admin must be associated with a company.',
      });
    }

    if (!role || !['GUARD', 'CLIENT'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be GUARD or CLIENT',
      });
    }

    const invitation = await invitationService.createInvitation({
      securityCompanyId,
      email,
      role,
      expiresInDays: expiresInDays || 7,
      maxUses: maxUses || 1,
      createdBy: req.userId!,
    });

    res.status(201).json({
      success: true,
      data: invitation,
      message: 'Invitation created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating invitation:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create invitation',
    });
  }
};

export const getInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const securityCompanyId = req.securityCompanyId;

    if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        error: 'Security company ID not found',
      });
    }

    const { role, isActive, isUsed } = req.query;

    const invitations = await invitationService.getCompanyInvitations(
      securityCompanyId,
      {
        role: role as 'GUARD' | 'CLIENT' | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isUsed: isUsed === 'true' ? true : isUsed === 'false' ? false : undefined,
      }
    );

    res.json({
      success: true,
      data: invitations,
    });
  } catch (error: any) {
    logger.error('Error getting invitations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get invitations',
    });
  }
};

export const getInvitationById = async (req: AuthRequest, res: Response) => {
  try {
    const securityCompanyId = req.securityCompanyId;
    const { id } = req.params;

    if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        error: 'Security company ID not found',
      });
    }

    const invitation = await invitationService.getInvitationById(id, securityCompanyId);

    res.json({
      success: true,
      data: invitation,
    });
  } catch (error: any) {
    logger.error('Error getting invitation:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Invitation not found',
    });
  }
};

export const revokeInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const securityCompanyId = req.securityCompanyId;
    const { id } = req.params;

    if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        error: 'Security company ID not found',
      });
    }

    await invitationService.revokeInvitation(id, securityCompanyId);

    res.json({
      success: true,
      message: 'Invitation revoked successfully',
    });
  } catch (error: any) {
    logger.error('Error revoking invitation:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to revoke invitation',
    });
  }
};

export const deleteInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const securityCompanyId = req.securityCompanyId;
    const { id } = req.params;

    if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        error: 'Security company ID not found',
      });
    }

    await invitationService.deleteInvitation(id, securityCompanyId);

    res.json({
      success: true,
      message: 'Invitation deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting invitation:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete invitation',
    });
  }
};

export default {
  createInvitation,
  getInvitations,
  getInvitationById,
  revokeInvitation,
  deleteInvitation,
};

