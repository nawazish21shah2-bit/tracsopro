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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { CreditCardIcon, CheckCircleIcon, ClockIcon, ErrorCircleIcon, DollarIcon } from '../../components/ui/AppIcons';
import paymentService from '../../services/paymentService';
import apiService from '../../services/api';

interface SubscriptionPlan {
  key: string;
  name: string;
  monthly: { priceId: string; amount: number };
  yearly: { priceId: string; amount: number };
}

interface CurrentSubscription {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

const AdminSubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
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
      const { company, subscription, availablePlans } = response.data.data;
      
      if (!company) {
        Alert.alert(
          'Company Not Found',
          'Your account is not associated with a security company. Please contact support to set up your company account.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setSecurityCompanyId(company.id);
      
      // Set plans from consolidated response
      if (availablePlans && availablePlans.plans) {
        setPlans(availablePlans.plans);
      } else {
        // Fallback: if plans not in response, try to get them separately
        try {
          const plansData = await paymentService.getPlans();
          setPlans(plansData.plans);
        } catch (error) {
          console.warn('Could not load plans:', error);
        }
      }
      
      // Set subscription data
      if (subscription) {
        setCurrentSubscription({
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.endDate,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        });
      } else {
        // Fallback: use company subscription data if subscription object not available
        setCurrentSubscription({
          plan: company.subscriptionPlan || 'BASIC',
          status: company.subscriptionStatus || 'TRIAL',
          currentPeriodEnd: company.subscriptionEndDate,
          cancelAtPeriodEnd: false,
        });
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
        securityCompanyId, // Still pass it for now, backend will use req.securityCompanyId if available
        priceId,
        trialDays: 14,
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE': return COLORS.success;
      case 'TRIAL': return COLORS.warning;
      case 'SUSPENDED': return COLORS.error;
      case 'CANCELLED': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircleIcon size={20} color={COLORS.success} />;
      case 'TRIAL': return <ClockIcon size={20} color={COLORS.warning} />;
      default: return <ErrorCircleIcon size={20} color={COLORS.error} />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Subscription & Billing</Text>
          <Text style={styles.subtitle}>Manage your platform subscription</Text>
        </View>

        {/* Current Subscription */}
        {currentSubscription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Subscription</Text>
            <View style={styles.currentSubscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionPlan}>{currentSubscription.plan}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(currentSubscription.status)}15` }]}>
                    {getStatusIcon(currentSubscription.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(currentSubscription.status) }]}>
                      {currentSubscription.status}
                    </Text>
                  </View>
                </View>
              </View>
              
              {currentSubscription.currentPeriodEnd && (
                <View style={styles.subscriptionDetails}>
                  <Text style={styles.detailLabel}>Renews on</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(currentSubscription.currentPeriodEnd)}
                  </Text>
                </View>
              )}

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
                    <Text style={styles.manageBillingButtonText}>Manage Billing</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
            const price = selectedBillingCycle === 'monthly' 
              ? plan.monthly.amount 
              : plan.yearly.amount;
            const isCurrentPlan = currentSubscription?.plan === plan.key;
            
            return (
              <View key={plan.key} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>
                      {formatCurrency(price)}
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
                  <Text style={styles.featureText}>✓ Unlimited guards</Text>
                  <Text style={styles.featureText}>✓ All features included</Text>
                  <Text style={styles.featureText}>✓ Priority support</Text>
                </View>

                {!isCurrentPlan && (
                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      processing && styles.subscribeButtonDisabled,
                    ]}
                    onPress={() => handleSubscribe(plan.key)}
                    disabled={processing}
                  >
                    {processing ? (
                      <ActivityIndicator color={COLORS.textInverse} />
                    ) : (
                      <Text style={styles.subscribeButtonText}>
                        {currentSubscription ? 'Upgrade' : 'Subscribe'}
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
          <Text style={styles.infoText}>
            All plans include a 14-day free trial. Cancel anytime.
          </Text>
        </View>
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
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 12,
    padding: SPACING.lg,
    margin: SPACING.lg,
    gap: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
});

export default AdminSubscriptionScreen;

