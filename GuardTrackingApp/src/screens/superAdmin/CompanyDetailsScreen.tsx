/**
 * Company Details Screen - View and edit company details
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { useRoute } from '@react-navigation/native';

interface CompanyDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate?: string;
  guardsCount: number;
  clientsCount: number;
  sitesCount: number;
  monthlyRevenue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CompanyDetailsScreen: React.FC = () => {
  const route = useRoute();
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyDetails();
  }, []);

  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      // Mock company data - replace with real API call
      const mockCompany: CompanyDetails = {
        id: '1',
        name: 'Elite Security Services',
        email: 'contact@elitesecurity.com',
        phone: '+1-555-0101',
        address: '123 Business Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        subscriptionPlan: 'PROFESSIONAL',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: '2024-01-15',
        subscriptionEndDate: '2025-01-15',
        guardsCount: 45,
        clientsCount: 12,
        sitesCount: 18,
        monthlyRevenue: 15000,
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-11-15T14:30:00Z',
      };
      setCompany(mockCompany);
    } catch (error) {
      console.error('Error loading company details:', error);
      Alert.alert('Error', 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendCompany = () => {
    Alert.alert(
      'Suspend Company',
      'Are you sure you want to suspend this company?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Suspend', style: 'destructive', onPress: () => console.log('Company suspended') },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Company Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!company) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Company not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{company.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: company.isActive ? COLORS.success : COLORS.error }]}>
            <Text style={styles.statusText}>{company.isActive ? 'ACTIVE' : 'SUSPENDED'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{company.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{company.phone || 'N/A'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>
                {company.address ? `${company.address}, ${company.city}, ${company.state} ${company.zipCode}` : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Plan</Text>
              <Text style={styles.infoValue}>{company.subscriptionPlan}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{company.subscriptionStatus}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>{new Date(company.subscriptionStartDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>
                {company.subscriptionEndDate ? new Date(company.subscriptionEndDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company.guardsCount}</Text>
              <Text style={styles.statLabel}>Guards</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company.clientsCount}</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company.sitesCount}</Text>
              <Text style={styles.statLabel}>Sites</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>${company.monthlyRevenue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Monthly Revenue</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Company</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suspendButton} onPress={handleSuspendCompany}>
            <Text style={styles.suspendButtonText}>Suspend Company</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default CompanyDetailsScreen;
