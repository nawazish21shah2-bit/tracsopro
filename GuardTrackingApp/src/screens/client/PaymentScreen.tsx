import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Download,
  Settings,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'react-native-feather';

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
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API calls
      const mockInvoices: Invoice[] = [
        {
          id: 'inv_1',
          amount: 4750,
          currency: 'usd',
          description: 'Security Services - November 2024',
          status: 'open',
          dueDate: '2024-12-15T00:00:00.000Z',
          createdAt: '2024-11-15T00:00:00.000Z',
        },
        {
          id: 'inv_2',
          amount: 3200,
          currency: 'usd',
          description: 'Security Services - October 2024',
          status: 'paid',
          dueDate: '2024-11-15T00:00:00.000Z',
          createdAt: '2024-10-15T00:00:00.000Z',
          paidAt: '2024-11-10T00:00:00.000Z',
        },
        {
          id: 'inv_3',
          amount: 2800,
          currency: 'usd',
          description: 'Security Services - September 2024',
          status: 'paid',
          dueDate: '2024-10-15T00:00:00.000Z',
          createdAt: '2024-09-15T00:00:00.000Z',
          paidAt: '2024-10-12T00:00:00.000Z',
        },
      ];

      const mockPaymentMethods: PaymentMethod[] = [
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

      setInvoices(mockInvoices);
      setPaymentMethods(mockPaymentMethods);
    } catch (error) {
      console.error('Error loading payment data:', error);
      Alert.alert('Error', 'Failed to load payment information');
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
      // Mock payment processing
      Alert.alert(
        'Payment Processing',
        'Your payment is being processed. You will receive a confirmation email shortly.',
        [{ text: 'OK' }]
      );
      
      // Update invoice status locally
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id 
          ? { ...inv, status: 'paid' as const, paidAt: new Date().toISOString() }
          : inv
      ));
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Payment Failed', 'There was an error processing your payment. Please try again.');
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
    Alert.alert(
      'Add Payment Method',
      'Payment method management will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleSetupAutoPay = () => {
    Alert.alert(
      'Setup Auto-Pay',
      'Would you like to set up automatic payments for future invoices?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Setup', onPress: () => setupAutomaticPayments() },
      ]
    );
  };

  const setupAutomaticPayments = () => {
    Alert.alert(
      'Auto-Pay Setup',
      'Automatic payments have been configured. Future invoices will be automatically paid using your default payment method.',
      [{ text: 'OK' }]
    );
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
      case 'paid': return <CheckCircle width={16} height={16} color="#10B981" />;
      case 'open': return <Clock width={16} height={16} color="#F59E0B" />;
      default: return <AlertCircle width={16} height={16} color="#6B7280" />;
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
          <Plus width={20} height={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {paymentMethods.map((method) => (
        <View key={method.id} style={styles.paymentMethodCard}>
          <View style={styles.paymentMethodInfo}>
            <CreditCard width={24} height={24} color="#374151" />
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
        <Settings width={20} height={20} color="#007AFF" />
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
                <Download width={16} height={16} color="#6B7280" />
              </TouchableOpacity>
              
              {invoice.status === 'open' && (
                <TouchableOpacity 
                  style={styles.payButton}
                  onPress={() => handlePayInvoice(invoice)}
                >
                  <Text style={styles.payButtonText}>Pay Now</Text>
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
        <DollarSign width={24} height={24} color="#007AFF" />
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  paymentMethodExpiry: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  autoPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  autoPayButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  invoiceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
  },
  invoiceAmountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
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
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  paidDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadButton: {
    padding: 8,
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PaymentScreen;
