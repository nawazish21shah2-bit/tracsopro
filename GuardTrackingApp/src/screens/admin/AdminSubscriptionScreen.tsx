/**
 * Admin Subscription Screen - Manage subscription and billing
 * For security companies/individuals to pay Super Admin (platform)
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
  Linking,
} from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { CreditCardIcon, DollarIcon } from '../../components/ui/AppIcons';
import SharedHeader from '../../components/ui/SharedHeader';
import { useRoleScreenHeader } from '../../hooks/useRoleScreenHeader';
import SubscriptionSummaryCard from '../../components/admin/SubscriptionSummaryCard';
import paymentService from '../../services/paymentService';
import apiService from '../../services/api';
import {
  SubscriptionOverview,
  PLAN_HIGHLIGHTS,
  formatPlanPrice,
  formatPlanDate,
} from '../../utils/subscriptionUtils';

interface SubscriptionPlan {
  key: string;
  name: string;
  monthly: { priceId: string; amount: number };
  yearly: { priceId: string; amount: number };
}

const AdminSubscriptionScreen: React.FC = () => {
  const { headerProps } = useRoleScreenHeader('Subscription & Billing', 'admin');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [securityCompanyId, setSecurityCompanyId] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Single consolidated API call - gets company, subscription, and plans in one request
      const response = await apiService.get('/admin/subscription');
      const { company, availablePlans, overview: overviewData } = response.data.data;

      if (!company) {
        Alert.alert(
          'Company Not Found',
          'Your account is not associated with a security company. Please contact support.',
          [{ text: 'OK' }]
        );
        return;
      }

      setSecurityCompanyId(company.id);
      setOverview(overviewData ?? null);

      if (availablePlans?.plans) {
        setPlans(availablePlans.plans);
      } else {
        try {
          const plansData = await paymentService.getPlans();
          setPlans(plansData.plans);
        } catch (error) {
          console.warn('Could not load plans:', error);
        }
      }
    } catch (error: any) {
      console.error('Error loading subscription data:', error);
      
      if (error.response?.status === 404) {
        Alert.alert(
          'Company Not Found',
          'Your account is not associated with a security company. Please contact support to set up your company account.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load subscription information';
      Alert.alert(
        'Error',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planKey: string) => {
    if (!securityCompanyId) {
      Alert.alert('Error', 'Security company ID not found. Please refresh the page.');
      return;
    }

    try {
      setProcessing(true);
      
      const selectedPlan = plans.find(p => p.key === planKey);
      if (!selectedPlan) {
        Alert.alert('Error', 'Plan not found');
        return;
      }

      const priceId = selectedBillingCycle === 'monthly' 
        ? selectedPlan.monthly.priceId 
        : selectedPlan.yearly.priceId;

      if (!priceId) {
        Alert.alert(
          'Configuration Error',
          'Stripe price ID not configured for this plan. Please contact support.'
        );
        return;
      }

      // securityCompanyId is now automatically included from the auth middleware
      const checkout = await paymentService.createSubscriptionCheckout({
        securityCompanyId,
        priceId,
        trialDays: 0,
      });

      if (__DEV__) {
        console.log('Checkout response:', JSON.stringify(checkout, null, 2));
      }

      if (!checkout || !checkout.url) {
        console.error('Checkout session created but no URL:', checkout);
        Alert.alert(
          'Error',
          'Checkout session created but no URL available. Please contact support.'
        );
        return;
      }

      // Open Stripe checkout in browser
      try {
        if (__DEV__) {
          console.log('Opening checkout URL:', checkout.url);
        }
        // Directly open URL - canOpenURL can be unreliable for HTTPS URLs
        await Linking.openURL(checkout.url);
        if (__DEV__) {
          console.log('URL opened successfully');
        }
      } catch (openError: any) {
        console.error('Error opening checkout URL:', openError);
        Alert.alert(
          'Error',
          `Unable to open payment page: ${openError.message || 'Unknown error'}. Please try again or contact support.`
        );
      }
    } catch (error: any) {
      console.error('Error creating subscription checkout:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create checkout session'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    if (!securityCompanyId) {
      Alert.alert('Error', 'Security company ID not found. Please refresh the page.');
      return;
    }

    try {
      setProcessing(true);
      // securityCompanyId is now automatically included from the auth middleware
      const portal = await paymentService.getBillingPortal(securityCompanyId);
      
      if (!portal || !portal.url) {
        Alert.alert(
          'Error',
          'Billing portal session created but no URL available. Please contact support.'
        );
        return;
      }

      try {
        if (__DEV__) {
          console.log('Opening billing portal URL:', portal.url);
        }
        await Linking.openURL(portal.url);
      } catch (openError: any) {
        console.error('Error opening billing portal URL:', openError);
        Alert.alert(
          'Error',
          `Unable to open billing portal: ${openError.message || 'Unknown error'}. Please try again or contact support.`
        );
      }
    } catch (error: any) {
      console.error('Error getting billing portal:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to open billing portal'
      );
    } finally {
      setProcessing(false);
    }
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() =>
      Alert.alert('Contact', email)
    );
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <SharedHeader {...headerProps} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader {...headerProps} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SubscriptionSummaryCard overview={overview} />

        {overview?.hasPaidSubscription && (
          <TouchableOpacity
            style={styles.manageBillingButton}
            onPress={handleManageBilling}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <CreditCardIcon size={20} color={COLORS.primary} />
                <Text style={styles.manageBillingButtonText}>Manage Billing Portal</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Billing Cycle Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Cycle</Text>
          <View style={styles.billingCycleContainer}>
            <TouchableOpacity
              style={[
                styles.billingCycleButton,
                selectedBillingCycle === 'monthly' && styles.billingCycleButtonActive,
              ]}
              onPress={() => setSelectedBillingCycle('monthly')}
            >
              <Text
                style={[
                  styles.billingCycleButtonText,
                  selectedBillingCycle === 'monthly' && styles.billingCycleButtonTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.billingCycleButton,
                selectedBillingCycle === 'yearly' && styles.billingCycleButtonActive,
              ]}
              onPress={() => setSelectedBillingCycle('yearly')}
            >
              <Text
                style={[
                  styles.billingCycleButtonText,
                  selectedBillingCycle === 'yearly' && styles.billingCycleButtonTextActive,
                ]}
              >
                Yearly (Save 17%)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {plans.map((plan) => {
            const priceCents =
              selectedBillingCycle === 'monthly' ? plan.monthly.amount : plan.yearly.amount;
            const isCurrentPlan =
              !overview?.isTrial &&
              overview?.hasPaidSubscription &&
              overview?.plan === plan.key;
            const highlights = PLAN_HIGHLIGHTS[plan.key] ?? [];

            return (
              <View key={plan.key} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>
                      {formatPlanPrice(priceCents)}
                      <Text style={styles.planPeriod}>
                        /{selectedBillingCycle === 'monthly' ? 'month' : 'year'}
                      </Text>
                    </Text>
                  </View>
                  {isCurrentPlan && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>

                <View style={styles.planFeatures}>
                  {highlights.map((line) => (
                    <Text key={line} style={styles.featureText}>
                      ✓ {line}
                    </Text>
                  ))}
                </View>

                {!isCurrentPlan && (
                  <TouchableOpacity
                    style={[styles.subscribeButton, processing && styles.subscribeButtonDisabled]}
                    onPress={() => handleSubscribe(plan.key)}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color={COLORS.textInverse} />
                    ) : (
                      <Text style={styles.subscribeButtonText}>
                        {overview?.hasPaidSubscription ? 'Switch to this plan' : 'Subscribe'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <DollarIcon size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              {overview?.isTrial
                ? 'You are on a free trial. Subscribe to increase guards, clients, and sites.'
                : 'Manage invoices and payment methods in the Stripe billing portal after subscribing.'}
            </Text>
            {overview?.support && (
              <View style={styles.contactRow}>
                <TouchableOpacity onPress={() => openEmail(overview.support.billingEmail)}>
                  <Text style={styles.link}>Billing: {overview.support.billingEmail}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEmail(overview.support.email)}>
                  <Text style={styles.link}>Support: {overview.support.email}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  manageBillingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
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
  header: {
    backgroundColor: COLORS.backgroundPrimary,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
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
  currentSubscriptionCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  subscriptionDetails: {
    marginBottom: SPACING.md,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  manageBillingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  manageBillingButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  billingCycleContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  billingCycleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  billingCycleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  billingCycleButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  billingCycleButtonTextActive: {
    color: COLORS.textInverse,
  },
  planCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  planPrice: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  planPeriod: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: COLORS.textSecondary,
  },
  currentBadge: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.success,
  },
  planFeatures: {
    marginBottom: SPACING.md,
  },
  featureText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.lg,
    gap: SPACING.md,
  },
  infoContent: { flex: 1 },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  contactRow: { gap: SPACING.xs },
  link: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default AdminSubscriptionScreen;

