import Stripe from 'stripe';
import { SubscriptionPlan } from '@prisma/client';
import subscriptionService from './subscriptionService.js';
import { planFromStripePriceId } from '../utils/planLimits.js';
import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  clientSecret: string;
  status: string;
  clientId: string;
  description: string;
  metadata?: Record<string, string>;
}

export interface Invoice {
  id: string;
  clientId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
  stripeInvoiceId?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  shiftId?: string;
  serviceType: 'guard_service' | 'overtime' | 'emergency_response' | 'equipment' | 'other';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export class PaymentService {
  private static instance: PaymentService;

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Create a payment intent for one-time payment
   */
  async createPaymentIntent(data: {
    clientId: string;
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    try {
      // Get client information
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        include: { user: true },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        description: data.description,
        metadata: {
          clientId: data.clientId,
          clientEmail: client.user.email,
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Store payment intent in database
      // Note: You might want to create a Payment model in your Prisma schema
      
      return {
        id: paymentIntent.id,
        amount: data.amount,
        currency: data.currency,
        clientSecret: paymentIntent.client_secret!,
        status: paymentIntent.status,
        clientId: data.clientId,
        description: data.description,
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create and send invoice to client
   */
  async createInvoice(data: {
    clientId: string;
    items: Omit<InvoiceItem, 'id' | 'totalPrice'>[];
    description: string;
    dueDate: Date;
    currency?: string;
  }): Promise<Invoice> {
    try {
      // Get client information
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        include: { user: true },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Calculate total amount
      const items: InvoiceItem[] = data.items.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        ...item,
        totalPrice: item.quantity * item.unitPrice,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

      // Create Stripe customer if doesn't exist
      let stripeCustomerId = client.user.email; // You might want to store this in the database
      
      try {
        const customers = await stripe.customers.list({
          email: client.user.email,
          limit: 1,
        });

        if (customers.data.length === 0) {
          const customer = await stripe.customers.create({
            email: client.user.email,
            name: `${client.user.firstName} ${client.user.lastName}`,
            metadata: {
              clientId: data.clientId,
            },
          });
          stripeCustomerId = customer.id;
        } else {
          stripeCustomerId = customers.data[0].id;
        }
      } catch (error) {
        logger.error('Error managing Stripe customer:', error);
      }

      // Create Stripe invoice
      const stripeInvoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        description: data.description,
        currency: (data.currency || 'usd').toLowerCase(),
        due_date: Math.floor(data.dueDate.getTime() / 1000),
        metadata: {
          clientId: data.clientId,
        },
      });

      // Add line items to Stripe invoice
      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          invoice: stripeInvoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_amount: Math.round(item.unitPrice * 100), // Convert to cents
          metadata: {
            serviceType: item.serviceType,
            shiftId: item.shiftId || '',
          },
        });
      }

      // Finalize and send the invoice
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id);

      // Get security company ID from client
      const companyClient = await prisma.companyClient.findFirst({
        where: { clientId: data.clientId, isActive: true },
        select: { securityCompanyId: true },
      });

      if (!companyClient) {
        throw new Error('Client not associated with a security company');
      }

      // Store invoice in database as BillingRecord
      const invoiceNumber = `INV-${Date.now()}-${data.clientId.slice(0, 8).toUpperCase()}`;
      const billingRecord = await prisma.billingRecord.create({
        data: {
          securityCompanyId: companyClient.securityCompanyId,
          type: 'SUBSCRIPTION',
          description: data.description || `Invoice for ${client.user.email}`,
          amount: totalAmount,
          currency: data.currency || 'USD',
          status: 'PENDING',
          dueDate: data.dueDate,
          invoiceNumber,
          stripeInvoiceId: finalizedInvoice.id,
        },
      });

      const invoice: Invoice = {
        id: billingRecord.id,
        clientId: data.clientId,
        amount: totalAmount,
        currency: data.currency || 'usd',
        description: data.description,
        status: 'open',
        dueDate: data.dueDate,
        createdAt: billingRecord.createdAt,
        stripeInvoiceId: finalizedInvoice.id,
        items,
      };

      logger.info(`📧 Invoice ${invoiceNumber} created and sent to ${client.user.email}`);

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Generate monthly invoice for client based on shifts
   */
  async generateMonthlyInvoice(clientId: string, year: number, month: number): Promise<Invoice> {
    try {
      // Get all completed shifts for the client in the specified month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const shifts = await prisma.shift.findMany({
        where: {
          clientId,
          status: 'COMPLETED',
          actualEndTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          guard: {
            include: {
              user: true,
            },
          },
          site: true,
        },
      });

      if (shifts.length === 0) {
        throw new Error('No completed shifts found for the specified period');
      }

      // Calculate invoice items
      const items: Omit<InvoiceItem, 'id' | 'totalPrice'>[] = [];
      const shiftsByRate: Record<string, any[]> = {};

      // Group shifts by hourly rate
      shifts.forEach(shift => {
        const rate = 25; // Default rate - you might want to store this in the database
        const key = `${rate}`;
        
        if (!shiftsByRate[key]) {
          shiftsByRate[key] = [];
        }
        shiftsByRate[key].push(shift);
      });

      // Create invoice items for each rate group
      Object.entries(shiftsByRate).forEach(([rate, shiftsGroup]) => {
        const totalHours = shiftsGroup.reduce((sum, shift) => {
          if (shift.actualStartTime && shift.actualEndTime) {
            const hours = (new Date(shift.actualEndTime).getTime() - new Date(shift.actualStartTime).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

        items.push({
          description: `Guard Services - ${shiftsGroup.length} shifts (${totalHours.toFixed(1)} hours)`,
          quantity: Math.round(totalHours * 10) / 10, // Round to 1 decimal place
          unitPrice: parseFloat(rate),
          serviceType: 'guard_service',
        });
      });

      // Add overtime charges if applicable
      const overtimeShifts = shifts.filter(shift => {
        if (shift.actualStartTime && shift.actualEndTime) {
          const hours = (new Date(shift.actualEndTime).getTime() - new Date(shift.actualStartTime).getTime()) / (1000 * 60 * 60);
          return hours > 8; // Overtime after 8 hours
        }
        return false;
      });

      if (overtimeShifts.length > 0) {
        const overtimeHours = overtimeShifts.reduce((sum, shift) => {
          const hours = (new Date(shift.actualEndTime!).getTime() - new Date(shift.actualStartTime!).getTime()) / (1000 * 60 * 60);
          return sum + Math.max(0, hours - 8);
        }, 0);

        if (overtimeHours > 0) {
          items.push({
            description: `Overtime Premium (1.5x rate)`,
            quantity: Math.round(overtimeHours * 10) / 10,
            unitPrice: 37.5, // 1.5x base rate
            serviceType: 'overtime',
          });
        }
      }

      // Create the invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      return await this.createInvoice({
        clientId,
        items,
        description: `Security Services - ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        dueDate,
        currency: 'usd',
      });
    } catch (error) {
      logger.error('Error generating monthly invoice:', error);
      throw error;
    }
  }

  /**
   * Set up automatic payments for a client
   */
  async setupAutomaticPayments(clientId: string, paymentMethodId: string): Promise<void> {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { user: true },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Get or create Stripe customer
      const customers = await stripe.customers.list({
        email: client.user.email,
        limit: 1,
      });

      let customerId: string;
      if (customers.data.length === 0) {
        const customer = await stripe.customers.create({
          email: client.user.email,
          name: `${client.user.firstName} ${client.user.lastName}`,
        });
        customerId = customer.id;
      } else {
        customerId = customers.data[0].id;
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      logger.info(`✅ Automatic payments set up for client ${clientId}`);
    } catch (error) {
      logger.error('Error setting up automatic payments:', error);
      throw error;
    }
  }

  /**
   * Verify Stripe signature, dedupe by event id, then process.
   */
  async processWebhookFromRawBody(
    rawBody: Buffer,
    signature: string | undefined
  ): Promise<{ received: boolean; duplicate?: boolean }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    const existing = await prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (existing) {
      return { received: true, duplicate: true };
    }

    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
      },
    });

    await this.handleWebhook(event);
    return { received: true };
  }

  /**
   * Process webhook events from Stripe
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionChanged(event.data.object as Stripe.Subscription);
          break;

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.info(`✅ Payment succeeded: ${paymentIntent.id}`);
    await prisma.billingRecord.updateMany({
      where: {
        OR: [
          { stripeInvoiceId: paymentIntent.id },
          ...(paymentIntent.metadata?.billingRecordId
            ? [{ id: paymentIntent.metadata.billingRecordId }]
            : []),
        ],
      },
      data: { status: 'PAID', paidDate: new Date() },
    });
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    logger.info(`❌ Payment failed: ${paymentIntent.id}`);
    await prisma.billingRecord.updateMany({
      where: { stripeInvoiceId: paymentIntent.id },
      data: { status: 'OVERDUE' },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    logger.info(`💰 Invoice paid: ${invoice.id}`);
    await prisma.billingRecord.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: { status: 'PAID', paidDate: new Date() },
    });

    if (invoice.subscription) {
      const subscriptionId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'ACTIVE', isActive: true },
      });
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (session.mode !== 'subscription' || !session.subscription) return;

    const securityCompanyId =
      session.metadata?.securityCompanyId ||
      (typeof session.subscription === 'object'
        ? session.subscription.metadata?.securityCompanyId
        : undefined);

    if (!securityCompanyId) {
      logger.warn('checkout.session.completed without securityCompanyId');
      return;
    }

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id;

    const stripeSub = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });

    await this.syncStripeSubscription(securityCompanyId, stripeSub);
  }

  private async handleSubscriptionChanged(stripeSub: Stripe.Subscription): Promise<void> {
    const securityCompanyId = stripeSub.metadata?.securityCompanyId;
    if (!securityCompanyId) return;
    await this.syncStripeSubscription(securityCompanyId, stripeSub);
  }

  private async syncStripeSubscription(
    securityCompanyId: string,
    stripeSub: Stripe.Subscription
  ): Promise<void> {
    const priceId = stripeSub.items.data[0]?.price?.id;
    const plan = planFromStripePriceId(priceId) ?? ('BASIC' as SubscriptionPlan);
    const interval = stripeSub.items.data[0]?.price?.recurring?.interval;
    const billingCycle = interval === 'year' ? 'YEARLY' : 'MONTHLY';
    const amount = (stripeSub.items.data[0]?.price?.unit_amount ?? 0) / 100;
    const endDate = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000)
      : null;

    if (['canceled', 'unpaid', 'incomplete_expired'].includes(stripeSub.status)) {
      await prisma.securityCompany.update({
        where: { id: securityCompanyId },
        data: { subscriptionStatus: 'CANCELLED' },
      });
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: stripeSub.id },
        data: { isActive: false, status: 'CANCELLED' },
      });
      return;
    }

    await subscriptionService.activatePaidPlan(securityCompanyId, plan, {
      stripeSubscriptionId: stripeSub.id,
      amount,
      billingCycle,
      endDate,
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.info(`💳 Invoice payment failed: ${invoice.id}`);
    await prisma.billingRecord.updateMany({
      where: { stripeInvoiceId: invoice.id },
      data: { status: 'OVERDUE' },
    });

    if (invoice.subscription) {
      const subscriptionId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: { status: 'SUSPENDED' },
      });
    }
  }

  /**
   * Get payment methods for a client
   */
  async getClientPaymentMethods(clientId: string): Promise<PaymentMethod[]> {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { user: true },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      const customers = await stripe.customers.list({
        email: client.user.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return [];
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customers.data[0].id,
        type: 'card',
      });

      return paymentMethods.data.map((pm: any) => ({
        id: pm.id,
        type: 'card',
        last4: pm.card?.last4 || '',
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        isDefault: customers.data[0].invoice_settings?.default_payment_method === pm.id,
      }));
    } catch (error) {
      logger.error('Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Create setup intent for adding new payment method
   */
  async createSetupIntent(clientId: string): Promise<{ clientSecret: string }> {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { user: true },
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Get or create Stripe customer
      let customerId: string;
      const customers = await stripe.customers.list({
        email: client.user.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        const customer = await stripe.customers.create({
          email: client.user.email,
          name: `${client.user.firstName} ${client.user.lastName}`,
        });
        customerId = customer.id;
      } else {
        customerId = customers.data[0].id;
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return {
        clientSecret: setupIntent.client_secret!,
      };
    } catch (error) {
      logger.error('Error creating setup intent:', error);
      throw error;
    }
  }
  
  async getOrCreateCompanyCustomer(securityCompanyId: string): Promise<string> {
    const company = await prisma.securityCompany.findUnique({ where: { id: securityCompanyId } });
    if (!company) {
      throw new Error('Security company not found');
    }
    let customerId: string | null = null;
    if (company.email) {
      const customers = await stripe.customers.list({ email: company.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email || undefined,
        name: company.name,
        metadata: { securityCompanyId },
      });
      customerId = customer.id;
    }
    return customerId;
  }

  getPlanCatalog() {
    return {
      currency: (process.env.BILLING_CURRENCY || 'USD').toUpperCase(),
      plans: [
        {
          key: 'BASIC',
          name: 'Basic Plan',
          monthly: { 
            priceId: process.env.STRIPE_PRICE_BASIC_MONTHLY || '', 
            amount: 4900 // $49.00 in cents
          },
          yearly: { 
            priceId: process.env.STRIPE_PRICE_BASIC_YEARLY || '', 
            amount: 49000 // $490.00 in cents (save 17%)
          },
        },
        {
          key: 'PROFESSIONAL',
          name: 'Professional Plan',
          monthly: { 
            priceId: process.env.STRIPE_PRICE_PROF_MONTHLY || '', 
            amount: 14900 // $149.00 in cents
          },
          yearly: { 
            priceId: process.env.STRIPE_PRICE_PROF_YEARLY || '', 
            amount: 149000 // $1,490.00 in cents (save 17%)
          },
        },
        {
          key: 'ENTERPRISE',
          name: 'Enterprise Plan',
          monthly: { 
            priceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '', 
            amount: 39900 // $399.00 in cents
          },
          yearly: { 
            priceId: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '', 
            amount: 399000 // $3,990.00 in cents (save 17%)
          },
        },
      ],
    };
  }

  async createSubscriptionCheckoutSession(params: {
    securityCompanyId: string;
    priceId: string;
    trialDays?: number;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{ id: string; url: string | null }> {
    const customer = await this.getOrCreateCompanyCustomer(params.securityCompanyId);
    const success_url = params.successUrl || process.env.STRIPE_SUCCESS_URL || 'https://example.com/success';
    const cancel_url = params.cancelUrl || process.env.STRIPE_CANCEL_URL || 'https://example.com/cancel';
    const trialDays = params.trialDays ?? 0;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price: params.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { securityCompanyId: params.securityCompanyId },
      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: { securityCompanyId: params.securityCompanyId },
      },
      success_url,
      cancel_url,
    });
    return { id: session.id, url: session.url };
  }

  async createBillingPortalSession(params: { securityCompanyId: string; returnUrl?: string }): Promise<{ url: string }> {
    const customer = await this.getOrCreateCompanyCustomer(params.securityCompanyId);
    const return_url = params.returnUrl || process.env.BILLING_PORTAL_RETURN_URL || 'https://example.com/account';
    const session = await stripe.billingPortal.sessions.create({ customer, return_url });
    return { url: session.url };
  }
}

export default PaymentService;
