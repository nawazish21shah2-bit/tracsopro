import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      console.error('Error creating payment intent:', error);
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
        console.error('Error managing Stripe customer:', error);
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

      console.log(`📧 Invoice ${invoiceNumber} created and sent to ${client.user.email}`);

      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
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
      console.error('Error generating monthly invoice:', error);
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

      console.log(`✅ Automatic payments set up for client ${clientId}`);
    } catch (error) {
      console.error('Error setting up automatic payments:', error);
      throw error;
    }
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
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
    // TODO: Update payment status in database
    // TODO: Send confirmation email to client
    // TODO: Update any related records (invoices, etc.)
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`❌ Payment failed: ${paymentIntent.id}`);
    // TODO: Update payment status in database
    // TODO: Send failure notification to client and admin
    // TODO: Handle retry logic if applicable
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    console.log(`💰 Invoice paid: ${invoice.id}`);
    // TODO: Update invoice status in database
    // TODO: Send receipt to client
    // TODO: Update client account status
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`💳 Invoice payment failed: ${invoice.id}`);
    // TODO: Update invoice status in database
    // TODO: Send payment failure notification
    // TODO: Handle dunning management
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
      console.error('Error getting payment methods:', error);
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
      console.error('Error creating setup intent:', error);
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
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price: params.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: params.trialDays ?? 14,
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
