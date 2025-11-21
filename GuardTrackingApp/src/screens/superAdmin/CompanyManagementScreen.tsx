/**
 * Company Management Screen - Manage all security companies
 * Pixel-perfect UI matching the app's design language
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { UserIcon, ReportsIcon, ShiftsIcon } from '../../components/ui/AppIcons';
import { superAdminService, SecurityCompany } from '../../services/superAdminService';
import { useNavigation } from '@react-navigation/native';

const CompanyManagementScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [companies, setCompanies] = useState<SecurityCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const loadCompanies = async () => {
    try {
      const data = await superAdminService.getSecurityCompanies({
        search: searchQuery,
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
      });
      setCompanies(data.companies);
    } catch (error) {
      console.error('Error loading companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, [searchQuery, selectedFilter]);

  useFocusEffect(
    React.useCallback(() => {
      loadCompanies();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCompanies();
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      await superAdminService.toggleCompanyStatus(companyId, !currentStatus);
      Alert.alert('Success', `Company ${!currentStatus ? 'activated' : 'suspended'} successfully`);
      loadCompanies();
    } catch (error) {
      Alert.alert('Error', 'Failed to update company status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return COLORS.success;
      case 'TRIAL': return COLORS.warning;
      case 'SUSPENDED': return COLORS.error;
      case 'CANCELLED': return COLORS.textSecondary;
      default: return COLORS.textSecondary;
    }
  };

  const handleViewDetails = (companyId: string) => {
    navigation.navigate('CompanyDetails', { companyId });
  };

  const handleAddCompany = () => {
    navigation.navigate('CreateCompany');
  };

  const CompanyCard: React.FC<{ company: SecurityCompany }> = ({ company }) => (
    <View style={styles.companyCard}>
      <View style={styles.companyHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyEmail}>{company.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(company.subscriptionStatus)}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(company.subscriptionStatus) }]}>
            {company.subscriptionStatus}
          </Text>
        </View>
      </View>

      <View style={styles.companyStats}>
        <View style={styles.statItem}>
          <UserIcon size={16} color={COLORS.primary} />
          <Text style={styles.statValue}>{company._count?.guards || 0}</Text>
          <Text style={styles.statLabel}>Guards</Text>
        </View>
        <View style={styles.statItem}>
          <UserIcon size={16} color={COLORS.warning} />
          <Text style={styles.statValue}>{company._count?.clients || 0}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statItem}>
          <ReportsIcon size={16} color={COLORS.success} />
          <Text style={styles.statValue}>{company._count?.sites || 0}</Text>
          <Text style={styles.statLabel}>Sites</Text>
        </View>
      </View>

      <View style={styles.companyDetails}>
        <Text style={styles.detailText}>Plan: {company.subscriptionPlan}</Text>
        <Text style={styles.detailText}>
          Limits: {company.maxGuards}G / {company.maxClients}C / {company.maxSites}S
        </Text>
      </View>

      <View style={styles.companyActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CompanyDetails' as never, { companyId: company.id } as never)}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.statusButton]}
          onPress={() => handleToggleStatus(company.id, company.isActive)}
        >
          <Text style={[styles.actionButtonText, styles.statusButtonText]}>
            {company.isActive ? 'Suspend' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Company Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateCompany' as never)}
        >
          <Text style={styles.addButtonText}>+ Add Company</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'ACTIVE', 'TRIAL', 'SUSPENDED'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive
              ]}>
                {filter === 'all' ? 'All' : filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Companies List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.companiesContainer}>
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
          
          {companies.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No companies found</Text>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  searchContainer: {
    marginBottom: SPACING.md,
  },
  searchInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    marginRight: SPACING.sm,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  companiesContainer: {
    padding: SPACING.lg,
  },
  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  companyEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  companyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  companyDetails: {
    marginBottom: SPACING.md,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  companyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary,
  },
  statusButton: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  statusButtonText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default CompanyManagementScreen;
