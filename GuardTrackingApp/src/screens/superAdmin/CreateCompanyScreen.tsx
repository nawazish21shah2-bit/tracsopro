/**
 * Create Company Screen - Form to create a new security company
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import CompanyPlanLimitsFields from '../../components/superAdmin/CompanyPlanLimitsFields';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { superAdminService } from '../../services/superAdminService';
import {
  SubscriptionPlanKey,
  applyPlanSelection,
  clampCustomLimit,
  getLimitsForPlan,
  isCustomPlan,
  parseLimitFields,
} from '../../utils/planLimits';

const CreateCompanyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    ...applyPlanSelection('BASIC'),
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanSelect = (plan: SubscriptionPlanKey) => {
    setFormData((prev) => ({
      ...prev,
      ...applyPlanSelection(plan),
    }));
  };

  const handleLimitChange = (
    field: 'maxGuards' | 'maxClients' | 'maxSites',
    value: string,
  ) => {
    if (!isCustomPlan(formData.subscriptionPlan)) return;
    setFormData((prev) => ({
      ...prev,
      [field]: clampCustomLimit(field, value),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Company name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    const limitsResult = parseLimitFields(
      formData.maxGuards,
      formData.maxClients,
      formData.maxSites,
      formData.subscriptionPlan as SubscriptionPlanKey,
    );
    if (!limitsResult.ok) {
      Alert.alert('Validation Error', limitsResult.message);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const limits = isCustomPlan(formData.subscriptionPlan)
      ? parseLimitFields(
          formData.maxGuards,
          formData.maxClients,
          formData.maxSites,
          'CUSTOM',
        )
      : { ok: true as const, limits: getLimitsForPlan(formData.subscriptionPlan as SubscriptionPlanKey) };

    if (!limits.ok) return;

    setLoading(true);
    try {
      await superAdminService.createSecurityCompany({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zipCode: formData.zipCode.trim() || undefined,
        country: formData.country.trim() || undefined,
        subscriptionPlan: formData.subscriptionPlan,
        maxGuards: limits.limits.maxGuards,
        maxClients: limits.limits.maxClients,
        maxSites: limits.limits.maxSites,
      });

      Alert.alert('Success', 'Company created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating company:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to create company',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor="#F5F7FA">
      <SharedHeader
        variant="superAdmin"
        title="Create Company"
        showLogo={false}
        showBackButton
        onBackPress={() => navigation.goBack()}
        hideProfileDrawer
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.formHint}>Add a new security company to the platform</Text>

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="company@example.com"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="+1-555-0123"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Street address"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              editable={!loading}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.flex1, styles.marginRight]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={formData.city}
                onChangeText={(value) => handleInputChange('city', value)}
                editable={!loading}
              />
            </View>
            <View style={[styles.formGroup, styles.flex1]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="State"
                value={formData.state}
                onChangeText={(value) => handleInputChange('state', value)}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.flex1, styles.marginRight]}>
              <Text style={styles.label}>Zip Code</Text>
              <TextInput
                style={styles.input}
                placeholder="12345"
                value={formData.zipCode}
                onChangeText={(value) => handleInputChange('zipCode', value)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
            <View style={[styles.formGroup, styles.flex1]}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                placeholder="Country"
                value={formData.country}
                onChangeText={(value) => handleInputChange('country', value)}
                editable={!loading}
              />
            </View>
          </View>

          <CompanyPlanLimitsFields
            subscriptionPlan={formData.subscriptionPlan}
            maxGuards={formData.maxGuards}
            maxClients={formData.maxClients}
            maxSites={formData.maxSites}
            onPlanSelect={handlePlanSelect}
            onLimitChange={handleLimitChange}
            disabled={loading}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Company</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  formHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  form: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
  buttonContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default CreateCompanyScreen;
