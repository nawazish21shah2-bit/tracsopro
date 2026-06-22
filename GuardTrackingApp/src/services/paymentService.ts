/**
 * Payment Service - Frontend service for payment functionality
 */

import { paymentApi } from './api/paymentApi';

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
  async createPaymentIntent(data: {
    amount: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    try {
      const response = await paymentApi.createPaymentIntent(data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

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
      const response = await paymentApi.getInvoices(params);
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

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await paymentApi.getPaymentMethods();
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  async createSetupIntent(): Promise<SetupIntent> {
    try {
      const response = await paymentApi.createSetupIntent();
      return response.data.data;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      throw error;
    }
  }

  async setupAutomaticPayments(paymentMethodId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await paymentApi.setupAutomaticPayments(paymentMethodId);
      return response.data;
    } catch (error) {
      console.error('Error setting up automatic payments:', error);
      throw error;
    }
  }

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
      const response = await paymentApi.createInvoice(data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async generateMonthlyInvoice(year: number, month: number): Promise<Invoice> {
    try {
      const response = await paymentApi.generateMonthlyInvoice(year, month);
      return response.data.data;
    } catch (error) {
      console.error('Error generating monthly invoice:', error);
      throw error;
    }
  }

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
      const response = await paymentApi.getPlans();
      return response.data.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  }

  async createSubscriptionCheckout(data: {
    securityCompanyId: string;
    priceId: string;
    trialDays?: number;
  }): Promise<{ id: string; url: string | null }> {
    try {
      const response = await paymentApi.createSubscriptionCheckout(data);
      if (__DEV__) {
        console.log('Checkout response:', JSON.stringify(response.data, null, 2));
      }

      const checkoutData = response.data?.data || response.data;

      if (!checkoutData) {
        throw new Error('Invalid response from checkout endpoint');
      }

      return checkoutData;
    } catch (error: any) {
      console.error('Error creating subscription checkout:', error);
      if (__DEV__) {
        console.error('Error details:', error.response?.data || error.message);
      }
      throw error;
    }
  }

  async getBillingPortal(securityCompanyId: string): Promise<{ url: string }> {
    try {
      const response = await paymentApi.getBillingPortal(securityCompanyId);
      return response.data.data;
    } catch (error) {
      console.error('Error getting billing portal:', error);
      throw error;
    }
  }
}

export default new PaymentService();
export const paymentService = new PaymentService();
