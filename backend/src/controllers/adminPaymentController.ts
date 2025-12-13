/**
 * Streamlined Admin Payment Controller
 * Handles subscription payments from Admin (security companies) to Super Admin (platform)
 */

import { Response } from 'express';
import { logger } from '../utils/logger.js';
import PaymentService from '../services/paymentService.js';
import prisma from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';

/**
 * Get admin's complete subscription information (company + subscription)
 * Consolidated endpoint to reduce API calls
 */
export const getAdminSubscriptionInfo = async (req: AuthRequest, res: Response) => {
  try {
    const securityCompanyId = req.securityCompanyId;
    
    if (!securityCompanyId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Security company not found for this admin' 
      });
    }

    // Get company with subscription info in one query
    const company = await prisma.securityCompany.findUnique({
      where: { id: securityCompanyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        isActive: true,
        subscriptions: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            stripeSubscriptionId: true,
            endDate: true,
            startDate: true,
            status: true,
            plan: true,
          }
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

    // Get available plans
    const svc = PaymentService.getInstance();
    const plans = svc.getPlanCatalog();

    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          isActive: company.isActive,
          stats: company._count
        },
        subscription: company.subscriptions[0] ? {
          plan: company.subscriptions[0].plan,
          status: company.subscriptions[0].status,
          startDate: company.subscriptions[0].startDate,
          endDate: company.subscriptions[0].endDate,
          stripeSubscriptionId: company.subscriptions[0].stripeSubscriptionId,
        } : {
          plan: company.subscriptionPlan,
          status: company.subscriptionStatus,
          startDate: company.subscriptionStartDate,
          endDate: company.subscriptionEndDate,
          stripeSubscriptionId: null,
        },
        availablePlans: plans
      }
    });
  } catch (error) {
    logger.error('Error getting admin subscription info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get subscription information' 
    });
  }
};

/**
 * Create subscription checkout session
 * Streamlined version that uses securityCompanyId from auth middleware
 */
export const createSubscriptionCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { priceId, trialDays } = req.body;
    const securityCompanyId = req.securityCompanyId;
    
    if (!securityCompanyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Security company ID not found. User must be associated with a security company.' 
      });
    }
    
    if (!priceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'priceId is required' 
      });
    }
    
    const svc = PaymentService.getInstance();
    const session = await svc.createSubscriptionCheckoutSession({
      securityCompanyId,
      priceId,
      trialDays: typeof trialDays === 'number' ? trialDays : 14,
      successUrl: process.env.STRIPE_SUCCESS_URL || `${process.env.FRONTEND_URL || 'https://example.com'}/admin/subscription?success=true`,
      cancelUrl: process.env.STRIPE_CANCEL_URL || `${process.env.FRONTEND_URL || 'https://example.com'}/admin/subscription?canceled=true`,
    });
    
    res.status(201).json({ 
      success: true, 
      data: session 
    });
  } catch (error) {
    logger.error('Error creating subscription checkout session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create checkout session' 
    });
  }
};

/**
 * Get billing portal session
 * Streamlined version that uses securityCompanyId from auth middleware
 */
export const getBillingPortal = async (req: AuthRequest, res: Response) => {
  try {
    const securityCompanyId = req.securityCompanyId;
    
    if (!securityCompanyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Security company ID not found. User must be associated with a security company.' 
      });
    }
    
    const svc = PaymentService.getInstance();
    const session = await svc.createBillingPortalSession({ 
      securityCompanyId, 
      returnUrl: process.env.BILLING_PORTAL_RETURN_URL || `${process.env.FRONTEND_URL || 'https://example.com'}/admin/subscription`
    });
    
    res.json({ 
      success: true, 
      data: session 
    });
  } catch (error) {
    logger.error('Error creating billing portal session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create billing portal session' 
    });
  }
};

/**
 * Get available subscription plans
 */
export const getPlans = async (_req: AuthRequest, res: Response) => {
  try {
    const svc = PaymentService.getInstance();
    const catalog = svc.getPlanCatalog();
    res.json({ 
      success: true, 
      data: catalog 
    });
  } catch (error) {
    logger.error('Error getting plans:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get plans' 
    });
  }
};

export default {
  getAdminSubscriptionInfo,
  createSubscriptionCheckout,
  getBillingPortal,
  getPlans,
};




