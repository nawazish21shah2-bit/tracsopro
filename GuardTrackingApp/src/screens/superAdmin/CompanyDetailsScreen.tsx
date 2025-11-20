/**
 * Company Details Screen - View and edit company details
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { superAdminService, SecurityCompany } from '../../services/superAdminService';

type CompanyDetails = SecurityCompany & {
  _count?: { users: number; guards: number; clients: number; sites: number };
};

const CompanyDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyDetails();
  }, []);

  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      const { companyId } = route.params || {};
      const data = await superAdminService.getCompanyById(companyId);
      setCompany(data as CompanyDetails);
    } catch (error) {
      console.error('Error loading company details:', error);
      Alert.alert('Error', 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = () => {
    if (!company) return;
    const action = company.isActive ? 'Suspend' : 'Activate';
    Alert.alert(
      `${action} Company`,
      `Are you sure you want to ${action.toLowerCase()} this company?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action, style: 'destructive', onPress: async () => {
          try {
            const updated = await superAdminService.toggleCompanyStatus(company.id, !company.isActive);
            setCompany(updated as CompanyDetails);
            Alert.alert('Success', `Company ${!company.isActive ? 'activated' : 'suspended'} successfully`);
          } catch (e) {
            Alert.alert('Error', 'Failed to update company status');
          }
        }}
      ]
    );
  };

  const handleDeleteCompany = () => {
    if (!company) return;
    Alert.alert(
      'Delete Company',
      'This action cannot be undone. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await superAdminService.deleteCompany(company.id);
            Alert.alert('Deleted', 'Company deleted successfully');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete company');
          }
        }}
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
              <Text style={styles.statValue}>{company._count?.guards ?? 0}</Text>
              <Text style={styles.statLabel}>Guards</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company._count?.clients ?? 0}</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company._count?.sites ?? 0}</Text>
              <Text style={styles.statLabel}>Sites</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Company</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suspendButton} onPress={handleToggleStatus}>
            <Text style={styles.suspendButtonText}>{company.isActive ? 'Suspend Company' : 'Activate Company'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteCompany}>
            <Text style={styles.deleteButtonText}>Delete Company</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.error,
  },
  scrollView: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoGrid: {
    rowGap: SPACING.md,
  },
  infoItem: {
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: '#F0F6FB',
    borderRadius: 10,
    marginRight: SPACING.md,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  suspendButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  suspendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CompanyDetailsScreen;
