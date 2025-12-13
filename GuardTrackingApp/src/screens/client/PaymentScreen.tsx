import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import {
  CreditCardIcon,
  DollarIcon,
  ShiftsIcon,
  DownloadIcon,
  SettingsIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ErrorCircleIcon,
} from '../../components/ui/AppIcons';
import paymentService, { Invoice, PaymentMethod } from '../../services/paymentService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

const PaymentScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      const [invoicesData, methodsData] = await Promise.all([
        paymentService.getInvoices({ page: 1, limit: 50 }),
        paymentService.getPaymentMethods(),
      ]);

      setInvoices(invoicesData.invoices);
      setPaymentMethods(methodsData);
    } catch (error: any) {
      console.error('Error loading payment data:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load payment information'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPaymentData();
    setRefreshing(false);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Pay Invoice',
      `Pay $${invoice.amount.toFixed(2)} for ${invoice.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => processPayment(invoice) },
      ]
    );
  };

  const processPayment = async (invoice: Invoice) => {
    try {
      setProcessingPayment(invoice.id);
      
      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent({
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        metadata: {
          invoiceId: invoice.id,
        },
      });

      // Initialize Stripe if not already done
      try {
        const stripeService = (await import('../../services/stripeService')).default;
        if (!stripeService.isInitialized()) {
          await stripeService.initialize();
        }
      } catch (error) {
        console.error('Stripe initialization error:', error);
        Alert.alert(
          'Payment Error',
          'Failed to initialize payment system. Please try again.',
        );
        return;
      }

      // Use Stripe PaymentSheet for payment
      try {
        // Initialize payment sheet
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: paymentIntent.clientSecret,
          merchantDisplayName: 'tracSOpro',
        });

        if (initError) {
          throw new Error(initError.message);
        }

        // Present payment sheet
        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          if (presentError.code !== 'Canceled') {
            throw new Error(presentError.message);
          }
          // User canceled - no error needed
          return;
        }

        // Payment successful
        Alert.alert(
          'Payment Successful',
          `Payment of $${invoice.amount.toFixed(2)} has been processed successfully.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh invoices to get updated status
                loadPaymentData();
              },
            },
          ]
        );
      } catch (error: any) {
        console.error('Payment processing error:', error);
        Alert.alert(
          'Payment Failed',
          error.message || 'There was an error processing your payment. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || 'There was an error processing your payment. Please try again.'
      );
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Download Invoice',
      'Invoice download feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleAddPaymentMethod = () => {
    navigation.navigate('PaymentMethods' as never);
  };

  const handleSetupAutoPay = () => {
    if (paymentMethods.length === 0) {
      Alert.alert(
        'No Payment Methods',
        'Please add a payment method first before setting up auto-pay.',
        [{ text: 'OK' }]
      );
      return;
    }

    const defaultMethod = paymentMethods.find(m => m.isDefault) || paymentMethods[0];
    
    Alert.alert(
      'Setup Auto-Pay',
      `Would you like to set up automatic payments using ${defaultMethod.brand?.toUpperCase()} •••• ${defaultMethod.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Setup', onPress: () => setupAutomaticPayments(defaultMethod.id) },
      ]
    );
  };

  const setupAutomaticPayments = async (paymentMethodId: string) => {
    try {
      await paymentService.setupAutomaticPayments(paymentMethodId);
      Alert.alert(
        'Auto-Pay Setup',
        'Automatic payments have been configured. Future invoices will be automatically paid using your default payment method.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error setting up auto-pay:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to set up automatic payments'
      );
    }
  };

  const getStatusColor = (status: Invoice['status']): string => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'open': return '#F59E0B';
      case 'draft': return '#6B7280';
      case 'void': return '#EF4444';
      case 'uncollectible': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon size={16} color={COLORS.success} />;
      case 'open': return <ClockIcon size={16} color={COLORS.warning} />;
      default: return <ErrorCircleIcon size={16} color={COLORS.textSecondary} />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAddPaymentMethod}>
          <PlusIcon size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {paymentMethods.map((method) => (
        <View key={method.id} style={styles.paymentMethodCard}>
          <View style={styles.paymentMethodInfo}>
            <CreditCardIcon size={24} color={COLORS.textPrimary} />
            <View style={styles.paymentMethodDetails}>
              <Text style={styles.paymentMethodText}>
                {method.brand?.toUpperCase()} •••• {method.last4}
              </Text>
              {method.expiryMonth && method.expiryYear && (
                <Text style={styles.paymentMethodExpiry}>
                  Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                </Text>
              )}
            </View>
          </View>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
      ))}
      
      <TouchableOpacity style={styles.autoPayButton} onPress={handleSetupAutoPay}>
        <SettingsIcon size={20} color={COLORS.primary} />
        <Text style={styles.autoPayButtonText}>Setup Auto-Pay</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInvoices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Invoices</Text>
      
      {invoices.map((invoice) => (
        <View key={invoice.id} style={styles.invoiceCard}>
          <View style={styles.invoiceHeader}>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceDescription}>{invoice.description}</Text>
              <Text style={styles.invoiceDate}>
                Due: {formatDate(invoice.dueDate)}
              </Text>
            </View>
            <View style={styles.invoiceAmount}>
              <Text style={styles.invoiceAmountText}>
                {formatCurrency(invoice.amount, invoice.currency)}
              </Text>
            </View>
          </View>
          
          <View style={styles.invoiceFooter}>
            <View style={styles.invoiceStatus}>
              {getStatusIcon(invoice.status)}
              <Text style={[styles.invoiceStatusText, { color: getStatusColor(invoice.status) }]}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Text>
              {invoice.paidAt && (
                <Text style={styles.paidDate}>
                  Paid: {formatDate(invoice.paidAt)}
                </Text>
              )}
            </View>
            
            <View style={styles.invoiceActions}>
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={() => handleDownloadInvoice(invoice)}
              >
                <DownloadIcon size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('InvoiceDetails' as never, { invoiceId: invoice.id } as never)}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
              
              {invoice.status === 'open' && (
                <TouchableOpacity 
                  style={[styles.payButton, processingPayment === invoice.id && styles.payButtonDisabled]}
                  onPress={() => handlePayInvoice(invoice)}
                  disabled={processingPayment === invoice.id}
                >
                  {processingPayment === invoice.id ? (
                    <ActivityIndicator color={COLORS.textInverse} size="small" />
                  ) : (
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaWrapper>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billing & Payments</Text>
        <DollarIcon size={24} color={COLORS.primary} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderPaymentMethods()}
        {renderInvoices()}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: SPACING.md,
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  paymentMethodExpiry: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  defaultBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  autoPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundTertiary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  autoPayButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  invoiceCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceDescription: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  invoiceDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  invoiceAmountText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invoiceStatusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: SPACING.xs + 2,
  },
  paidDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  downloadButton: {
    padding: SPACING.sm,
  },
  viewButton: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  },
  viewButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    ...SHADOWS.small,
  },
  payButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
});

export default PaymentScreen;
