/**
 * Company Details Screen - View and edit company details
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { useRoute, useNavigation } from '@react-navigation/native';
import { superAdminService, SecurityCompany } from '../../services/superAdminService';

const CompanyDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [company, setCompany] = useState<SecurityCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const companyId = (route.params as any)?.companyId;

  useEffect(() => {
    if (companyId) {
      loadCompanyDetails();
    } else {
      Alert.alert('Error', 'Company ID not provided', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [companyId]);

  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getCompanyById(companyId);
      setCompany(data);
    } catch (error: any) {
      console.error('Error loading company details:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = () => {
    if (!company) return;
    
    const action = company.isActive ? 'suspend' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Company`,
      `Are you sure you want to ${action} this company?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: company.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setUpdating(true);
              const updated = await superAdminService.toggleCompanyStatus(company.id, !company.isActive);
              setCompany(updated);
              Alert.alert('Success', `Company ${action}d successfully`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || `Failed to ${action} company`);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{company.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: company.isActive ? `${COLORS.success}15` : `${COLORS.error}15` }]}>
            <Text style={[styles.statusText, { color: company.isActive ? COLORS.success : COLORS.error }]}>
              {company.isActive ? 'ACTIVE' : 'SUSPENDED'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{company.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{company.phone || 'N/A'}</Text>
            </View>
            {company.address && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>
                  {[company.address, company.city, company.state, company.zipCode].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
            {company.country && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Country</Text>
                <Text style={styles.infoValue}>{company.country}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>
          <View style={styles.infoCard}>
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
              <Text style={styles.infoValue}>
                {new Date(company.subscriptionStartDate).toLocaleDateString()}
              </Text>
            </View>
            {company.subscriptionEndDate && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>End Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(company.subscriptionEndDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company._count?.guards || 0}</Text>
              <Text style={styles.statLabel}>Guards</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company._count?.clients || 0}</Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company._count?.sites || 0}</Text>
              <Text style={styles.statLabel}>Sites</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{company._count?.users || 0}</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resource Limits</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Max Guards</Text>
              <Text style={styles.infoValue}>{company.maxGuards}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Max Clients</Text>
              <Text style={styles.infoValue}>{company.maxClients}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Max Sites</Text>
              <Text style={styles.infoValue}>{company.maxSites}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, company.isActive ? styles.suspendButton : styles.activateButton]}
            onPress={handleToggleStatus}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>
                {company.isActive ? 'Suspend Company' : 'Activate Company'}
              </Text>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
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
    marginBottom: SPACING.md,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    marginBottom: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  actionsSection: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  actionButton: {
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  suspendButton: {
    backgroundColor: COLORS.error,
  },
  activateButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default CompanyDetailsScreen;
