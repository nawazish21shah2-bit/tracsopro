/**
 * Create Company Screen - Form to create a new security company
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { useNavigation } from '@react-navigation/native';
import { superAdminService } from '../../services/superAdminService';

const CreateCompanyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    subscriptionPlan: 'BASIC',
    maxGuards: '10',
    maxClients: '5',
    maxSites: '10',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Company name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation', err);
      return;
    }
    try {
      setSubmitting(true);
      await superAdminService.createSecurityCompany({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode || undefined,
        country: form.country || undefined,
        subscriptionPlan: form.subscriptionPlan,
        maxGuards: Number(form.maxGuards) || 10,
        maxClients: Number(form.maxClients) || 5,
        maxSites: Number(form.maxSites) || 10,
      });
      Alert.alert('Success', 'Company created successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Company</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Company Name</Text>
          <TextInput style={styles.input} placeholder="e.g. SecureGuard Solutions" value={form.name} onChangeText={v => update('name', v)} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="company@example.com" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={v => update('email', v)} />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} placeholder="+1-555-0101" value={form.phone} onChangeText={v => update('phone', v)} />
          </View>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Plan</Text>
            <TextInput style={styles.input} placeholder="BASIC | PROFESSIONAL | ENTERPRISE" value={form.subscriptionPlan} onChangeText={v => update('subscriptionPlan', v)} />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput style={styles.input} placeholder="Street address" value={form.address} onChangeText={v => update('address', v)} />
        </View>
        <View style={styles.row}>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>City</Text>
            <TextInput style={styles.input} value={form.city} onChangeText={v => update('city', v)} />
          </View>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>State</Text>
            <TextInput style={styles.input} value={form.state} onChangeText={v => update('state', v)} />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Zip</Text>
            <TextInput style={styles.input} value={form.zipCode} onChangeText={v => update('zipCode', v)} />
          </View>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Country</Text>
            <TextInput style={styles.input} value={form.country} onChangeText={v => update('country', v)} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Max Guards</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={form.maxGuards} onChangeText={v => update('maxGuards', v)} />
          </View>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Max Clients</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={form.maxClients} onChangeText={v => update('maxClients', v)} />
          </View>
          <View style={[styles.formGroup, styles.rowItem]}>
            <Text style={styles.label}>Max Sites</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={form.maxSites} onChangeText={v => update('maxSites', v)} />
          </View>
        </View>

        <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Company'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F0FA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  rowItem: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default CreateCompanyScreen;
