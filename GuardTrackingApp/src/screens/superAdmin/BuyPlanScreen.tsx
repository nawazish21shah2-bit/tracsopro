/**
 * Buy Plan Screen - Subscription plan selection and purchase
 * Matches the exact UI design from the app
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';

interface PlanFeature {
  label: string;
  value: string | boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  isPopular?: boolean;
}

const BuyPlanScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const plans: Plan[] = [
    {
      id: 'BASIC',
      name: 'BASIC',
      description: 'Best for small businesses',
      monthlyPrice: 30,
      yearlyPrice: 300,
      features: [
        { label: 'Sites', value: '1' },
        { label: 'Guards', value: '3' },
        { label: 'Basic Reporting', value: true },
      ],
    },
    {
      id: 'PROFESSIONAL',
      name: 'PROFESSIONAL',
      description: 'Best for Large Firms',
      monthlyPrice: 100,
      yearlyPrice: 1000,
      isPopular: true,
      features: [
        { label: 'Sites', value: '5' },
        { label: 'Guards', value: '20' },
        { label: 'Basic Reporting', value: true },
        { label: 'Real-Time Map Tracking', value: true },
        { label: 'Emergency Reporting', value: true },
        { label: 'Push Notifications', value: true },
      ],
    },
    {
      id: 'ENTERPRISE',
      name: 'ENTERPRISE',
      description: 'Large company, multi sites',
      monthlyPrice: 300,
      yearlyPrice: 3000,
      features: [
        { label: 'Sites', value: 'Unlimited' },
        { label: 'Guards', value: 'Unlimited' },
        { label: 'Basic Reporting', value: true },
        { label: 'Real-Time Map Tracking', value: true },
        { label: 'Emergency Reporting', value: true },
        { label: 'Push Notifications', value: true },
      ],
    },
  ];

  const handleGetStarted = (plan: Plan) => {
    const price = billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
    Alert.alert(
      'Subscribe to Plan',
      `You are about to subscribe to the ${plan.name} plan for $${price} ${billingCycle === 'MONTHLY' ? 'per month' : 'per year'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to payment screen or handle subscription
            // navigation?.navigate('Payment', { plan, billingCycle, price });
            Alert.alert('Success', 'Subscription process initiated');
          },
        },
      ]
    );
  };

  const renderFeature = (feature: PlanFeature, index: number) => (
    <View key={index} style={styles.featureRow}>
      <Text style={styles.featureLabel}>{feature.label}:</Text>
      <Text style={styles.featureValue}>
        {typeof feature.value === 'boolean' ? (feature.value ? 'Yes' : 'No') : feature.value}
      </Text>
    </View>
  );

  const renderPlanCard = (plan: Plan) => {
    const price = billingCycle === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
    const isPopular = plan.isPopular;

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          isPopular && styles.planCardPopular,
        ]}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
        </View>

        <View style={styles.pricingContainer}>
          <Text style={styles.pricingLabel}>
            {billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}:
          </Text>
          <Text style={styles.pricingAmount}>
            <Text style={styles.pricingValue}>{price}</Text> USD
          </Text>
        </View>

        {billingCycle === 'MONTHLY' && (
          <Text style={styles.yearlyPriceHint}>
            Yearly: <Text style={styles.yearlyPriceValue}>{plan.yearlyPrice} USD</Text>
          </Text>
        )}
        {billingCycle === 'YEARLY' && (
          <Text style={styles.monthlyPriceHint}>
            Monthly: <Text style={styles.monthlyPriceValue}>{plan.monthlyPrice} USD</Text>
          </Text>
        )}

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => renderFeature(feature, index))}
        </View>

        <TouchableOpacity
          style={[
            styles.getStartedButton,
            isPopular && styles.getStartedButtonPopular,
          ]}
          onPress={() => handleGetStarted(plan)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.getStartedButtonText,
              isPopular && styles.getStartedButtonTextPopular,
            ]}
          >
            Get Started →
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SharedHeader
        variant="admin"
        title="Buy Plan"
        showLogo={false}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>Become a member</Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              billingCycle === 'MONTHLY' && styles.toggleOptionActive,
            ]}
            onPress={() => setBillingCycle('MONTHLY')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === 'MONTHLY' && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              billingCycle === 'YEARLY' && styles.toggleOptionActive,
            ]}
            onPress={() => setBillingCycle('YEARLY')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === 'YEARLY' && styles.toggleTextActive,
              ]}
            >
              Yearly
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan) => renderPlanCard(plan))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxxxl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.round,
    padding: SPACING.xs,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  toggleOption: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    minWidth: 64,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  plansContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  },
  planCard: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.xl,
    ...SHADOWS.small,
  },
  planCardPopular: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  planHeader: {
    marginBottom: SPACING.lg,
  },
  planName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  planDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  pricingContainer: {
    marginBottom: SPACING.sm,
  },
  pricingLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  pricingAmount: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  pricingValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  yearlyPriceHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  yearlyPriceValue: {
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  monthlyPriceHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  monthlyPriceValue: {
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  featuresContainer: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  featureValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
  },
  getStartedButton: {
    backgroundColor: COLORS.backgroundPrimary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedButtonPopular: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  getStartedButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  getStartedButtonTextPopular: {
    color: COLORS.textInverse,
  },
});

export default BuyPlanScreen;

