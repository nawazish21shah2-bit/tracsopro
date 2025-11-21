/**
 * Payment Service - Frontend service for payment functionality
 */

import apiService from './api';

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
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  stripeInvoiceId?: string;
  items?: InvoiceItem[];
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

export interface SetupIntent {
  clientSecret: string;
}

class PaymentService {
  /**
   * Create payment intent for one-time payment
   */
  async createPaymentIntent(data: {
    amount: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    try {
      const response = await apiService.post('/payments/intent', {
        amount: data.amount,
        currency: data.currency || 'usd',
        description: data.description,
        metadata: data.metadata,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Get client invoices
   */
  async getInvoices(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{
    invoices: Invoice[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiService.get('/payments/invoices', { params });
      return {
        invoices: response.data.data || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiService.get('/payments/methods');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Create setup intent for adding payment method
   */
  async createSetupIntent(): Promise<SetupIntent> {
    try {
      const response = await apiService.post('/payments/setup-intent');
      return response.data.data;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw error;
    }
  }

  /**
   * Setup automatic payments
   */
  async setupAutomaticPayments(paymentMethodId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post('/payments/auto-pay', {
        paymentMethodId,
      });
      return response.data;
    } catch (error) {
      console.error('Error setting up automatic payments:', error);
      throw error;
    }
  }

  /**
   * Create invoice (Admin only)
   */
  async createInvoice(data: {
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      serviceType: 'guard_service' | 'overtime' | 'emergency_response' | 'equipment' | 'other';
    }>;
    description?: string;
    dueDate?: string;
    currency?: string;
  }): Promise<Invoice> {
    try {
      const response = await apiService.post('/payments/invoice', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Generate monthly invoice (Admin only)
   */
  async generateMonthlyInvoice(year: number, month: number): Promise<Invoice> {
    try {
      const response = await apiService.post('/payments/invoice/monthly', {
        year,
        month,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error generating monthly invoice:', error);
      throw error;
    }
  }

  /**
   * Get subscription plans (Admin/Super Admin only)
   */
  async getPlans(): Promise<{
    currency: string;
    plans: Array<{
      key: string;
      name: string;
      monthly: { priceId: string; amount: number };
      yearly: { priceId: string; amount: number };
    }>;
  }> {
    try {
      const response = await apiService.get('/payments/plans');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  /**
   * Create subscription checkout session (Admin/Super Admin only)
   */
  async createSubscriptionCheckout(data: {
    securityCompanyId: string;
    priceId: string;
    trialDays?: number;
  }): Promise<{ id: string; url: string | null }> {
    try {
      const response = await apiService.post('/payments/subscriptions/checkout', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating subscription checkout:', error);
      throw error;
    }
  }

  /**
   * Get billing portal session (Admin/Super Admin only)
   */
  async getBillingPortal(securityCompanyId: string): Promise<{ url: string }> {
    try {
      const response = await apiService.get('/payments/portal', {
        params: { securityCompanyId },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting billing portal:', error);
      throw error;
    }
  }
}

export default new PaymentService();
export const paymentService = new PaymentService();

