/**
 * Admin Routes - Routes for admin (security company) operations
 */

import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth';
import prisma from '../config/database';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/admin/company
 * Get admin's security company information
 */
router.get('/company', authorize('ADMIN'), async (req: any, res) => {
  try {
    const securityCompanyId = req.securityCompanyId;
    
    if (!securityCompanyId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Security company not found for this admin' 
      });
    }

    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
      include: {
        subscriptions: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            users: true,
            guards: true,
            clients: true,
            sites: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Security company not found' 
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error('Error getting admin company:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get company information' 
    });
  }
});

/**
 * GET /api/admin/subscription
 * Get admin's current subscription
 */
router.get('/subscription', authorize('ADMIN'), async (req: any, res) => {
  try {
    const securityCompanyId = req.securityCompanyId;
    
    if (!securityCompanyId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Security company not found' 
      });
    }

    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        isActive: true,
        subscriptions: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        message: 'Security company not found' 
      });
    }

    res.json({
      success: true,
      data: {
        plan: company.subscriptionPlan,
        status: company.subscriptionStatus,
        startDate: company.subscriptionStartDate,
        endDate: company.subscriptionEndDate,
        isActive: company.isActive,
        stripeSubscriptionId: company.subscriptions[0]?.stripeSubscriptionId,
        cancelAtPeriodEnd: company.subscriptions[0]?.cancelAtPeriodEnd || false,
      }
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get subscription information' 
    });
  }
});

export default router;

