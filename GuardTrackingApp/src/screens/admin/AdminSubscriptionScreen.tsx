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
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
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
      
      // Get admin's security company
      const companyResponse = await apiService.get('/admin/company');
      const company = companyResponse.data.data;
      
      if (!company) {
        Alert.alert('Error', 'Security company not found');
        return;
      }
      
      setSecurityCompanyId(company.id);
      
      // Get plans and subscription in parallel
      const [plansData, subscriptionResponse] = await Promise.all([
        paymentService.getPlans(),
        apiService.get('/admin/subscription'),
      ]);
      
      setPlans(plansData.plans);
      
      const subscription = subscriptionResponse.data.data;
      
      setCurrentSubscription({
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.endDate,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      });
    } catch (error: any) {
      console.error('Error loading subscription data:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load subscription information'
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

      if (checkout.url) {
        // Open Stripe checkout in browser
        const canOpen = await Linking.canOpenURL(checkout.url);
        if (canOpen) {
          await Linking.openURL(checkout.url);
        } else {
          Alert.alert(
            'Error',
            'Unable to open payment page. Please contact support.'
          );
        }
      } else {
        Alert.alert(
          'Error',
          'Checkout session created but no URL available. Please contact support.'
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
      
      const canOpen = await Linking.canOpenURL(portal.url);
      if (canOpen) {
        await Linking.openURL(portal.url);
      } else {
        Alert.alert(
          'Error',
          'Unable to open billing portal. Please contact support.'
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
                      <ActivityIndicator color="#FFFFFF" />
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#FFFFFF',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
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

