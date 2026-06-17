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
  Modal,
  Clipboard,
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

const generateTemporaryPassword = () => `Trac${Math.floor(100000 + Math.random() * 900000)}!`;

const CreateCompanyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
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

    const adminLoginEmail = (formData.adminEmail.trim() || formData.email.trim()).toLowerCase();
    const temporaryPassword = generateTemporaryPassword();

    setLoading(true);
    try {
      const result = await superAdminService.createSecurityCompany({
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
        adminFirstName: formData.adminFirstName.trim() || undefined,
        adminLastName: formData.adminLastName.trim() || undefined,
        adminEmail: adminLoginEmail,
        adminPassword: temporaryPassword,
        createAdmin: true,
      });

      const credentials = result.adminCredentials ?? {
        email: adminLoginEmail,
        temporaryPassword,
      };

      setCreatedCredentials(credentials);
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

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.temporaryPassword}`;
    Clipboard.setString(text);
    Alert.alert('Copied', 'Admin login details copied to clipboard.');
  };

  const handleCloseCredentialsModal = () => {
    setCreatedCredentials(null);
    navigation.goBack();
  };

  return (
    <SafeAreaWrapper backgroundColor="#F5F7FA">
      <Modal
        visible={createdCredentials !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseCredentialsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Company Created</Text>
            <Text style={styles.modalSubtitle}>
              Share these admin login details with the company. They should change the password after first login.
            </Text>

            <View style={styles.credentialBlock}>
              <Text style={styles.credentialLabel}>Admin Email</Text>
              <Text style={styles.credentialValue} selectable>
                {createdCredentials?.email}
              </Text>
            </View>

            <View style={styles.credentialBlock}>
              <Text style={styles.credentialLabel}>Temporary Password</Text>
              <Text style={styles.credentialValue} selectable>
                {createdCredentials?.temporaryPassword}
              </Text>
            </View>

            <TouchableOpacity style={styles.copyButton} onPress={handleCopyCredentials}>
              <Text style={styles.copyButtonText}>Copy Login Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneButton} onPress={handleCloseCredentialsModal}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

          <Text style={styles.sectionTitle}>Company Admin Account</Text>
          <Text style={styles.sectionHint}>
            An admin login is created automatically. The admin can sign in with the email below and the temporary password shown after creation.
          </Text>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.flex1, styles.marginRight]}>
              <Text style={styles.label}>Admin First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="First name"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.adminFirstName}
                onChangeText={(value) => handleInputChange('adminFirstName', value)}
                editable={!loading}
              />
            </View>
            <View style={[styles.formGroup, styles.flex1]}>
              <Text style={styles.label}>Admin Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Last name"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.adminLastName}
                onChangeText={(value) => handleInputChange('adminLastName', value)}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Admin Login Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Defaults to company email if left blank"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.adminEmail}
              onChangeText={(value) => handleInputChange('adminEmail', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
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
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  credentialBlock: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  credentialLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  credentialValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  copyButton: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  copyButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  doneButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default CreateCompanyScreen;
