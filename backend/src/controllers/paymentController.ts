import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import PaymentService from '../services/paymentService.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    clientId?: string;
  };
}

/**
 * Get plan catalog (prices and features)
 */
export const getPlans = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const svc = PaymentService.getInstance();
    const catalog = svc.getPlanCatalog();
    res.json({ success: true, data: catalog });
  } catch (error) {
    logger.error('Error getting plans:', error);
    res.status(500).json({ success: false, message: 'Failed to get plans' });
  }
};

/**
 * Create Stripe Checkout Session for subscription (14-day trial by default)
 */
export const createSubscriptionCheckout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { priceId, trialDays } = req.body;
    const securityCompanyId = (req as any).securityCompanyId || req.body.securityCompanyId;
    
    if (!securityCompanyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Security company ID not found. User must be associated with a security company.' 
      });
    }
    
    if (!priceId) {
      return res.status(400).json({ success: false, message: 'priceId is required' });
    }
    
    const svc = PaymentService.getInstance();
    const session = await svc.createSubscriptionCheckoutSession({
      securityCompanyId,
      priceId,
      trialDays: typeof trialDays === 'number' ? trialDays : 14,
      successUrl: process.env.STRIPE_SUCCESS_URL || 'https://example.com/success',
      cancelUrl: process.env.STRIPE_CANCEL_URL || 'https://example.com/cancel',
    });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    logger.error('Error creating subscription checkout session:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
};

/**
 * Create Billing Portal session for security company
 */
export const getBillingPortal = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const securityCompanyId = (req as any).securityCompanyId || (req.query as any).securityCompanyId;
    
    if (!securityCompanyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Security company ID not found. User must be associated with a security company.' 
      });
    }
    
    const svc = PaymentService.getInstance();
    const session = await svc.createBillingPortalSession({ 
      securityCompanyId, 
      returnUrl: process.env.BILLING_PORTAL_RETURN_URL || 'https://example.com/account' 
    });
    res.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error creating billing portal session:', error);
    res.status(500).json({ success: false, message: 'Failed to create billing portal session' });
  }
};

/**
 * Create payment intent for one-time payment
 */
export const createPaymentIntent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, currency = 'usd', description, metadata } = req.body;
    const clientId = req.user?.clientId || req.user?.id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    const svc = PaymentService.getInstance();
    const paymentIntent = await svc.createPaymentIntent({
      clientId,
      amount,
      currency,
      description: description || 'Security services payment',
      metadata: metadata || {},
    });

    logger.info(`Payment intent created: ${paymentIntent.id} for client ${clientId}`);

    res.status(201).json({
      success: true,
      data: paymentIntent,
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Create invoice for client
 */
export const createInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, description, dueDate, currency = 'usd' } = req.body;
    const clientId = req.user?.clientId || req.user?.id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice items are required',
      });
    }

    const svc = PaymentService.getInstance();
    const invoice = await svc.createInvoice({
      clientId,
      items: items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        serviceType: item.serviceType || 'guard_service',
      })),
      description: description || 'Security services invoice',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency,
    });

    logger.info(`Invoice created: ${invoice.id} for client ${clientId} - $${invoice.amount}`);

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    logger.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Generate monthly invoice for client
 */
export const generateMonthlyInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year, month } = req.body;
    const clientId = req.user?.clientId || req.user?.id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found',
      });
    }

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Valid year and month are required',
      });
    }

    const svc = PaymentService.getInstance();
    const invoice = await svc.generateMonthlyInvoice(clientId, year, month);

    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    logger.info(`Monthly invoice generated: ${invoice.id} for ${monthName} - $${invoice.amount}`);

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    logger.error('Error generating monthly invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly invoice',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Get client payment methods
 */
export const getPaymentMethods = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.user?.clientId || req.user?.id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found',
      });
    }

    const svc = PaymentService.getInstance();
    const paymentMethods = await svc.getClientPaymentMethods(clientId);

    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Create setup intent for adding payment method
 */
export const createSetupIntent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.user?.clientId || req.user?.id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found',
      });
    }

    const svc = PaymentService.getInstance();
    const setupIntent = await svc.createSetupIntent(clientId);

    res.json({
      success: true,
      data: setupIntent,
    });
  } catch (error) {
    logger.error('Error creating setup intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setup intent',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Setup automatic payments
 */
export const setupAutomaticPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentMethodId } = req.body;
    const clientId = req.user?.clientId || req.user?.id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found',
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required',
      });
    }

    const svc = PaymentService.getInstance();
    await svc.setupAutomaticPayments(clientId, paymentMethodId);

    logger.info(`Automatic payments set up for client ${clientId} with payment method ${paymentMethodId}`);

    res.json({
      success: true,
      message: 'Automatic payments have been set up successfully',
    });
  } catch (error) {
    logger.error('Error setting up automatic payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set up automatic payments',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

/**
 * Handle Stripe webhook
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Mock webhook handling
    logger.info('Webhook received:', { signature, payload });

    // In real implementation, verify webhook signature and process events
    res.json({ received: true });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook handling failed',
    });
  }
};

/**
 * Get invoices for client
 */
export const getInvoices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = req.user?.clientId || req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID not found',
      });
    }

    // TODO: Implement database query for invoices
    // For now, return empty array - invoices should be stored in database
    // when created via createInvoice or generateMonthlyInvoice
    const mockInvoices: any[] = [];

    const filteredInvoices = status 
      ? mockInvoices.filter(inv => inv.status === status)
      : mockInvoices;

    res.json({
      success: true,
      data: filteredInvoices,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: filteredInvoices.length,
        totalPages: Math.ceil(filteredInvoices.length / parseInt(limit as string)),
      },
    });
  } catch (error) {
    logger.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export default {
  createPaymentIntent,
  createInvoice,
  generateMonthlyInvoice,
  getPaymentMethods,
  createSetupIntent,
  setupAutomaticPayments,
  handleWebhook,
  getInvoices,
  getPlans,
  createSubscriptionCheckout,
  getBillingPortal,
};
