import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
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

const EditCompanyScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const companyId = (route.params as any)?.companyId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    subscriptionPlan: 'BASIC' as SubscriptionPlanKey,
    maxGuards: '10',
    maxClients: '5',
    maxSites: '10',
  });

  useEffect(() => {
    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const company = await superAdminService.getCompanyById(companyId);
      setFormData({
        name: company.name,
        email: company.email,
        phone: company.phone || '',
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zipCode: company.zipCode || '',
        country: company.country || 'USA',
        subscriptionPlan: company.subscriptionPlan,
        maxGuards: String(company.maxGuards),
        maxClients: String(company.maxClients),
        maxSites: String(company.maxSites),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load company');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Validation Error', 'Name and email are required');
      return;
    }

    const limitsResult = parseLimitFields(
      formData.maxGuards,
      formData.maxClients,
      formData.maxSites,
      formData.subscriptionPlan as SubscriptionPlanKey,
    );
    if (!limitsResult.ok) {
      Alert.alert('Validation Error', limitsResult.message);
      return;
    }

    setSaving(true);
    try {
      await superAdminService.updateSecurityCompany(companyId, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zipCode: formData.zipCode.trim() || undefined,
        country: formData.country.trim() || undefined,
        subscriptionPlan: formData.subscriptionPlan,
        maxGuards: limitsResult.limits.maxGuards,
        maxClients: limitsResult.limits.maxClients,
        maxSites: limitsResult.limits.maxSites,
      } as any);

      Alert.alert('Success', 'Company updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update company');
    } finally {
      setSaving(false);
    }
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
    <SafeAreaWrapper backgroundColor="#F5F7FA">
      <SharedHeader
        variant="superAdmin"
        title="Edit Company"
        showLogo={false}
        showBackButton
        onBackPress={() => navigation.goBack()}
        hideProfileDrawer
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {(['name', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country'] as const).map(
            (field) => (
              <View key={field} style={styles.formGroup}>
                <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                <TextInput
                  style={styles.input}
                  value={formData[field]}
                  onChangeText={(v) => handleInputChange(field, v)}
                  editable={!saving}
                  autoCapitalize={field === 'email' ? 'none' : 'sentences'}
                  keyboardType={field === 'email' ? 'email-address' : 'default'}
                />
              </View>
            )
          )}

          <CompanyPlanLimitsFields
            subscriptionPlan={formData.subscriptionPlan}
            maxGuards={formData.maxGuards}
            maxClients={formData.maxClients}
            maxSites={formData.maxSites}
            onPlanSelect={handlePlanSelect}
            onLimitChange={handleLimitChange}
            disabled={saving}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { padding: SPACING.lg },
  formGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
    color: COLORS.textPrimary,
  },
  input: {
    backgroundColor: COLORS.backgroundPrimary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  submitButton: {
    margin: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: COLORS.textInverse, fontWeight: TYPOGRAPHY.fontWeight.semibold },
});

export default EditCompanyScreen;
