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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { superAdminService } from '../../services/superAdminService';

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
    subscriptionPlan: 'BASIC',
    maxGuards: '10',
    maxClients: '5',
    maxSites: '10',
  });

  const subscriptionPlans = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

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
        maxGuards: parseInt(formData.maxGuards) || 10,
        maxClients: parseInt(formData.maxClients) || 5,
        maxSites: parseInt(formData.maxSites) || 10,
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
        error.response?.data?.error || error.message || 'Failed to create company'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Company</Text>
          <Text style={styles.subtitle}>Add a new security company to the platform</Text>
        </View>

        <View style={styles.form}>
          {/* Company Name */}
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

          {/* Email */}
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

          {/* Phone */}
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

          {/* Address */}
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

          {/* City, State, Zip */}
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

          {/* Subscription Plan */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subscription Plan *</Text>
            <View style={styles.planContainer}>
              {subscriptionPlans.map((plan) => (
                <TouchableOpacity
                  key={plan}
                  style={[
                    styles.planButton,
                    formData.subscriptionPlan === plan && styles.planButtonActive,
                  ]}
                  onPress={() => handleInputChange('subscriptionPlan', plan)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.planButtonText,
                      formData.subscriptionPlan === plan && styles.planButtonTextActive,
                    ]}
                  >
                    {plan}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Limits */}
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Resource Limits</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.flex1, styles.marginRight]}>
              <Text style={styles.label}>Max Guards</Text>
              <TextInput
                style={styles.input}
                placeholder="10"
                value={formData.maxGuards}
                onChangeText={(value) => handleInputChange('maxGuards', value)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
            <View style={[styles.formGroup, styles.flex1]}>
              <Text style={styles.label}>Max Clients</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                value={formData.maxClients}
                onChangeText={(value) => handleInputChange('maxClients', value)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Max Sites</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              value={formData.maxSites}
              onChangeText={(value) => handleInputChange('maxSites', value)}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
        </View>

        {/* Submit Button */}
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
  form: {
    padding: SPACING.lg,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderColor: '#E5E7EB',
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
    color: '#FFFFFF',
  },
  sectionTitle: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitleText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
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
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default CreateCompanyScreen;
