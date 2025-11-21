/**
 * Invoice Details Screen - View detailed invoice information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { DownloadIcon, CheckCircleIcon, ClockIcon, ErrorCircleIcon } from '../../components/ui/AppIcons';
import paymentService, { Invoice } from '../../services/paymentService';

const InvoiceDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const invoiceId = (route.params as any)?.invoiceId;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    } else {
      Alert.alert('Error', 'Invoice ID not provided', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getInvoices({ page: 1, limit: 100 });
      const foundInvoice = data.invoices.find(inv => inv.id === invoiceId);
      
      if (!foundInvoice) {
        Alert.alert('Error', 'Invoice not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      
      setInvoice(foundInvoice);
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = () => {
    if (!invoice) return;
    
    Alert.alert(
      'Pay Invoice',
      `Pay $${invoice.amount.toFixed(2)} for ${invoice.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: processPayment },
      ]
    );
  };

  const processPayment = async () => {
    if (!invoice) return;
    
    try {
      setProcessingPayment(true);
      const paymentIntent = await paymentService.createPaymentIntent({
        amount: invoice.amount,
        currency: invoice.currency,
        description: invoice.description,
        metadata: {
          invoiceId: invoice.id,
        },
      });

      Alert.alert(
        'Payment Initiated',
        `Payment intent created. Please complete the payment using your payment method.`,
        [
          {
            text: 'OK',
            onPress: () => {
              loadInvoice();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || 'There was an error processing your payment. Please try again.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadInvoice = () => {
    Alert.alert(
      'Download Invoice',
      'Invoice download feature will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status: Invoice['status']): string => {
    switch (status) {
      case 'paid': return COLORS.success;
      case 'open': return COLORS.warning;
      case 'draft': return COLORS.textSecondary;
      case 'void': return COLORS.error;
      case 'uncollectible': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon size={20} color={COLORS.success} />;
      case 'open': return <ClockIcon size={20} color={COLORS.warning} />;
      default: return <ErrorCircleIcon size={20} color={COLORS.textSecondary} />;
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
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invoice not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Invoice Details</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(invoice.status)}15` }]}>
            {getStatusIcon(invoice.status)}
            <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Invoice Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice ID</Text>
              <Text style={styles.infoValue}>{invoice.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{invoice.description}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={[styles.infoValue, styles.amountValue]}>
                {formatCurrency(invoice.amount, invoice.currency)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.createdAt)}</Text>
            </View>
            {invoice.paidAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Paid</Text>
                <Text style={styles.infoValue}>{formatDate(invoice.paidAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.itemsCard}>
              {invoice.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    <Text style={styles.itemDetails}>
                      {item.quantity} × {formatCurrency(item.unitPrice, invoice.currency)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatCurrency(item.totalPrice, invoice.currency)}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrency(invoice.amount, invoice.currency)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownloadInvoice}
          >
            <DownloadIcon size={20} color={COLORS.primary} />
            <Text style={styles.downloadButtonText}>Download Invoice</Text>
          </TouchableOpacity>

          {invoice.status === 'open' && (
            <TouchableOpacity
              style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
              onPress={handlePayInvoice}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.payButtonText}>Pay Invoice</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  itemDetails: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  itemTotal: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  actionsSection: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  downloadButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default InvoiceDetailsScreen;

