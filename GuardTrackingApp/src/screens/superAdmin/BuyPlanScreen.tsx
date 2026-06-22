/**
 * Buy Plan Screen - Stripe subscription for a company (Super Admin)
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
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SuperAdminStackParamList } from '../../navigation/SuperAdminNavigator';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import BackNavButton from '../../components/common/BackNavButton';
import { superAdminService } from '../../services/superAdminService';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../styles/globalStyles';

type BuyPlanRoute = RouteProp<SuperAdminStackParamList, 'BuyPlan'>;

interface PlanOption {
  key: string;
  name: string;
  monthly: { priceId: string; amount: number };
  yearly: { priceId: string; amount: number };
}

const BuyPlanScreen: React.FC = () => {
  const route = useRoute<BuyPlanRoute>();
  const navigation = useNavigation();
  const { companyId } = route.params;

  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getCompanySubscription(companyId);
      setCompanyName(data.company?.name || 'Company');
      setPlans(data.availablePlans?.plans || []);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription plans', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  const handleSubscribe = async (plan: PlanOption) => {
    const priceInfo = billingCycle === 'MONTHLY' ? plan.monthly : plan.yearly;
    if (!priceInfo.priceId) {
      Alert.alert(
        'Configuration Error',
        'Stripe price ID not configured for this plan. Set STRIPE_PRICE_* env vars on the server.'
      );
      return;
    }

    Alert.alert(
      'Subscribe',
      `Start ${plan.key} (${billingCycle.toLowerCase()}) for ${companyName} at ${formatPrice(priceInfo.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              setProcessing(plan.key);
              const checkout = await superAdminService.createCompanySubscriptionCheckout(companyId, {
                priceId: priceInfo.priceId,
                trialDays: 14,
              });
              if (!checkout?.url) {
                Alert.alert('Error', 'Checkout session created but no URL returned');
                return;
              }
              await Linking.openURL(checkout.url);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to start checkout');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader variant="superAdmin" title="Manage Subscription" />
      <BackNavButton
        style={styles.backRow}
        onPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.companyLabel}>{companyName}</Text>

        <View style={styles.toggleContainer}>
          {(['MONTHLY', 'YEARLY'] as const).map((cycle) => (
            <TouchableOpacity
              key={cycle}
              style={[styles.toggleOption, billingCycle === cycle && styles.toggleActive]}
              onPress={() => setBillingCycle(cycle)}
            >
              <Text style={[styles.toggleText, billingCycle === cycle && styles.toggleTextActive]}>
                {cycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {plans.map((plan) => {
          const price = billingCycle === 'MONTHLY' ? plan.monthly : plan.yearly;
          return (
            <View key={plan.key} style={styles.planCard}>
              <Text style={styles.planName}>{plan.name || plan.key}</Text>
              <Text style={styles.planPrice}>
                {formatPrice(price.amount)} / {billingCycle === 'MONTHLY' ? 'month' : 'year'}
              </Text>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => handleSubscribe(plan)}
                disabled={processing === plan.key}
              >
                {processing === plan.key ? (
                  <ActivityIndicator color={COLORS.textInverse} />
                ) : (
                  <Text style={styles.subscribeText}>Get Started →</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxxxl },
  companyLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  toggleOption: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.fontSize.sm },
  toggleTextActive: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.fontWeight.semibold },
  planCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  planName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  planPrice: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginVertical: SPACING.sm,
  },
  subscribeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  subscribeText: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default BuyPlanScreen;
