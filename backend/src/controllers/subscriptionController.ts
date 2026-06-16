import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import subscriptionService from '../services/subscriptionService.js';
import { logger } from '../utils/logger.js';

export const getSubscriptionOverview = async (req: AuthRequest, res: Response) => {
  try {
    const securityCompanyId = req.securityCompanyId;

    if (!securityCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Company context not found for this account',
      });
    }

    const overview = await subscriptionService.getSubscriptionInfo(securityCompanyId);

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    logger.error('Error getting subscription overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load subscription limits',
    });
  }
};
