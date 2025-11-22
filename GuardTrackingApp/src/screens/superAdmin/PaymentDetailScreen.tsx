/**
 * Payment Detail Screen - View and manage individual payment records
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
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import { SuperAdminStackParamList } from '../../navigation/SuperAdminNavigator';
import { superAdminService } from '../../services/superAdminService';
import { CheckCircleIcon, ClockIcon, ErrorCircleIcon, DollarIcon } from '../../components/ui/AppIcons';

type PaymentDetailRouteProp = RouteProp<SuperAdminStackParamList, 'PaymentDetail'>;
type NavigationProp = StackNavigationProp<SuperAdminStackParamList>;

interface PaymentRecord {
  id: string;
  type: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  stripeInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
  securityCompany: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  };
  subscription?: {
    id: string;
    plan: string;
    status: string;
    billingCycle: string;
  };
}

const PaymentDetailScreen: React.FC = () => {
  const route = useRoute<PaymentDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { paymentId } = route.params;

  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPaymentDetails();
  }, [paymentId]);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getPaymentRecordById(paymentId);
      setPayment(data);
    } catch (error: any) {
      console.error('Error loading payment details:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load payment details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = () => {
    if (!payment) return;

    Alert.alert(
      'Mark as Paid',
      `Are you sure you want to mark this payment of $${payment.amount.toLocaleString()} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              setProcessing(true);
              await superAdminService.updatePaymentStatus(
                payment.id,
                'PAID',
                new Date().toISOString()
              );
              Alert.alert('Success', 'Payment marked as paid');
              loadPaymentDetails();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to update payment status');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return COLORS.success;
      case 'PENDING':
        return COLORS.warning;
      case 'OVERDUE':
        return COLORS.error;
      case 'CANCELLED':
        return COLORS.textSecondary;
      case 'REFUNDED':
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircleIcon size={24} color={COLORS.success} />;
      case 'PENDING':
        return <ClockIcon size={24} color={COLORS.warning} />;
      case 'OVERDUE':
        return <ErrorCircleIcon size={24} color={COLORS.error} />;
      default:
        return <ClockIcon size={24} color={COLORS.textSecondary} />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <SharedHeader variant="admin" title="Payment Details" showLogo={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!payment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <SharedHeader variant="admin" title="Payment Details" showLogo={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Payment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SharedHeader variant="admin" title="Payment Details" showLogo={false} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getStatusIcon(payment.status)}
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                {payment.status}
              </Text>
            </View>
          </View>
          <View style={styles.amountDisplay}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(payment.amount, payment.currency)}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{payment.type}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{payment.description}</Text>
            </View>
            {payment.invoiceNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Invoice Number</Text>
                <Text style={styles.infoValue}>{payment.invoiceNumber}</Text>
              </View>
            )}
            {payment.stripeInvoiceId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Stripe Invoice ID</Text>
                <Text style={[styles.infoValue, styles.monoText]}>{payment.stripeInvoiceId}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{formatDate(payment.dueDate)}</Text>
            </View>
            {payment.paidDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Paid Date</Text>
                <Text style={styles.infoValue}>{formatDate(payment.paidDate)}</Text>
              </View>
            )}
            {payment.paymentMethod && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>{payment.paymentMethod}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Company Name</Text>
              <Text style={styles.infoValue}>{payment.securityCompany.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{payment.securityCompany.email}</Text>
            </View>
            {payment.securityCompany.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{payment.securityCompany.phone}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Subscription Plan</Text>
              <Text style={styles.infoValue}>{payment.securityCompany.subscriptionPlan}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Subscription Status</Text>
              <Text style={styles.infoValue}>{payment.securityCompany.subscriptionStatus}</Text>
            </View>
            {payment.securityCompany.address && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {[
                    payment.securityCompany.address,
                    payment.securityCompany.city,
                    payment.securityCompany.state,
                    payment.securityCompany.zipCode,
                    payment.securityCompany.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Information */}
        {payment.subscription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription Details</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plan</Text>
                <Text style={styles.infoValue}>{payment.subscription.plan}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{payment.subscription.status}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Billing Cycle</Text>
                <Text style={styles.infoValue}>{payment.subscription.billingCycle}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timestamps</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created At</Text>
              <Text style={styles.infoValue}>{formatDate(payment.createdAt)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDate(payment.updatedAt)}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {payment.status === 'PENDING' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.markPaidButton}
              onPress={handleMarkAsPaid}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <>
                  <CheckCircleIcon size={20} color={COLORS.textInverse} />
                  <Text style={styles.markPaidButtonText}>Mark as Paid</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxxxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxxxl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  statusCard: {
    backgroundColor: COLORS.backgroundPrimary,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
  },
  amountDisplay: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  amountValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    flex: 1,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    flex: 2,
    textAlign: 'right',
  },
  monoText: {
    fontFamily: 'monospace',
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  actionsContainer: {
    margin: SPACING.lg,
    marginBottom: SPACING.xxxxxl,
  },
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  markPaidButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
});

export default PaymentDetailScreen;



