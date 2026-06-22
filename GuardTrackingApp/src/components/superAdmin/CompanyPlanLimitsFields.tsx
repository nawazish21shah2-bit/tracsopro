import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FormInput from '../common/FormInput';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlanKey,
  formatPlanLabel,
  isCustomPlan,
  CUSTOM_PLAN_MAX,
} from '../../utils/planLimits';

interface CompanyPlanLimitsFieldsProps {
  subscriptionPlan: string;
  maxGuards: string;
  maxClients: string;
  maxSites: string;
  onPlanSelect: (plan: SubscriptionPlanKey) => void;
  onLimitChange: (field: 'maxGuards' | 'maxClients' | 'maxSites', value: string) => void;
  disabled?: boolean;
}

const CompanyPlanLimitsFields: React.FC<CompanyPlanLimitsFieldsProps> = ({
  subscriptionPlan,
  maxGuards,
  maxClients,
  maxSites,
  onPlanSelect,
  onLimitChange,
  disabled = false,
}) => {
  const limitsEditable = isCustomPlan(subscriptionPlan) && !disabled;

  return (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Subscription Plan *</Text>
        <View style={styles.planContainer}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan}
              style={[
                styles.planButton,
                subscriptionPlan === plan && styles.planButtonActive,
              ]}
              onPress={() => onPlanSelect(plan)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.planButtonText,
                  subscriptionPlan === plan && styles.planButtonTextActive,
                ]}
              >
                {formatPlanLabel(plan)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>Resource Limits</Text>
        <Text style={styles.sectionHint}>
          {limitsEditable
            ? `Custom plan — set limits (max ${CUSTOM_PLAN_MAX.maxGuards} guards, ${CUSTOM_PLAN_MAX.maxClients} clients, ${CUSTOM_PLAN_MAX.maxSites} sites)`
            : 'Limits are set automatically for the selected plan'}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.flex1, styles.marginRight]}>
          <FormInput
            label="Max Guards"
            placeholder="10"
            value={maxGuards}
            onChangeText={(value) => onLimitChange('maxGuards', value)}
            keyboardType="numeric"
            editable={limitsEditable}
            disabled={!limitsEditable}
          />
        </View>
        <View style={[styles.formGroup, styles.flex1]}>
          <FormInput
            label="Max Clients"
            placeholder="5"
            value={maxClients}
            onChangeText={(value) => onLimitChange('maxClients', value)}
            keyboardType="numeric"
            editable={limitsEditable}
            disabled={!limitsEditable}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <FormInput
          label="Max Sites"
          placeholder="10"
          value={maxSites}
          onChangeText={(value) => onLimitChange('maxSites', value)}
          keyboardType="numeric"
          editable={limitsEditable}
          disabled={!limitsEditable}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginRight: {
    marginRight: SPACING.sm,
  },
  planContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  planButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minWidth: 100,
    alignItems: 'center',
  },
  planButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  planButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  planButtonTextActive: {
    color: COLORS.textInverse,
  },
  sectionTitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitleText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  sectionHint: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default CompanyPlanLimitsFields;
