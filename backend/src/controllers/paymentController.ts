import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    clientId?: string;
  };
}

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

    // Mock payment intent (replace with actual Stripe integration)
    const paymentIntent = {
      id: `pi_${Date.now()}`,
      amount,
      currency,
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      status: 'requires_payment_method',
      clientId,
      description: description || 'Security services payment',
      metadata: metadata || {},
    };

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

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // Mock invoice (replace with actual Stripe integration)
    const invoice = {
      id: `inv_${Date.now()}`,
      clientId,
      amount: totalAmount,
      currency,
      description: description || 'Security services invoice',
      status: 'open',
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      items: items.map((item: any, index: number) => ({
        id: `item_${Date.now()}_${index}`,
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      })),
    };

    logger.info(`Invoice created: ${invoice.id} for client ${clientId} - $${totalAmount}`);

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

    // Mock monthly invoice generation
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const mockItems = [
      {
        id: 'item_1',
        description: `Guard Services - ${monthName}`,
        quantity: 160, // hours
        unitPrice: 25,
        totalPrice: 4000,
        serviceType: 'guard_service',
      },
      {
        id: 'item_2',
        description: 'Overtime Premium (1.5x rate)',
        quantity: 20, // overtime hours
        unitPrice: 37.5,
        totalPrice: 750,
        serviceType: 'overtime',
      },
    ];

    const invoice = {
      id: `inv_monthly_${Date.now()}`,
      clientId,
      amount: 4750,
      currency: 'usd',
      description: `Security Services - ${monthName}`,
      status: 'open',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      items: mockItems,
    };

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

    // Mock payment methods
    const paymentMethods = [
      {
        id: 'pm_1',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      },
      {
        id: 'pm_2',
        type: 'card',
        last4: '0005',
        brand: 'mastercard',
        expiryMonth: 8,
        expiryYear: 2026,
        isDefault: false,
      },
    ];

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

    // Mock setup intent
    const setupIntent = {
      clientSecret: `seti_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
    };

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

    // Mock setup automatic payments
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

    // Mock invoices
    const mockInvoices = [
      {
        id: 'inv_1',
        amount: 4750,
        currency: 'usd',
        description: 'Security Services - November 2024',
        status: 'paid',
        dueDate: '2024-12-15T00:00:00.000Z',
        createdAt: '2024-11-15T00:00:00.000Z',
        paidAt: '2024-11-20T00:00:00.000Z',
      },
      {
        id: 'inv_2',
        amount: 3200,
        currency: 'usd',
        description: 'Security Services - October 2024',
        status: 'open',
        dueDate: '2024-12-01T00:00:00.000Z',
        createdAt: '2024-10-15T00:00:00.000Z',
      },
    ];

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
};
