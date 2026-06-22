import apiService from '../api';

export const paymentApi = {
  createPaymentIntent: (data: {
    amount: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, string>;
  }) => apiService.post('/payments/intent', data),
  getInvoices: (params?: { page?: number; limit?: number; status?: string }) =>
    apiService.get('/payments/invoices', { params }),
  getPaymentMethods: () => apiService.get('/payments/methods'),
  createSetupIntent: () => apiService.post('/payments/setup-intent'),
  setupAutomaticPayments: (paymentMethodId: string) =>
    apiService.post('/payments/auto-pay', { paymentMethodId }),
  createInvoice: (data: Record<string, unknown>) => apiService.post('/payments/invoice', data),
  generateMonthlyInvoice: (year: number, month: number) =>
    apiService.post('/payments/invoice/monthly', { year, month }),
  getPlans: () => apiService.get('/payments/plans'),
  createSubscriptionCheckout: (data: {
    securityCompanyId: string;
    priceId: string;
    trialDays?: number;
  }) => apiService.post('/payments/subscriptions/checkout', data),
  getBillingPortal: (securityCompanyId: string) =>
    apiService.get('/payments/portal', { params: { securityCompanyId } }),
};
