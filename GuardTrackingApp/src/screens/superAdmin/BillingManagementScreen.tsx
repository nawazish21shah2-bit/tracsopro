/**
 * Billing Management Screen - Billing and subscription management
 * Updated UI to match app design system
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SuperAdminStackParamList } from '../../navigation/SuperAdminNavigator';

interface BillingRecord {
  id: string;
  companyName: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  plan: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
}

type NavigationProp = StackNavigationProp<SuperAdminStackParamList>;

const BillingManagementScreen: React.FC<{ navigation?: any }> = ({ navigation: navProp }) => {
  const navigation = useNavigation<NavigationProp>();
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const billing = await superAdminService.getBillingOverview();
      
      // Transform backend data to frontend format
      const records: BillingRecord[] = (billing.recentTransactions || []).map((transaction: any) => ({
        id: transaction.id,
        companyName: transaction.securityCompany?.name || 'Unknown Company',
        amount: transaction.amount || 0,
        status: transaction.status || 'PENDING',
        dueDate: transaction.dueDate || transaction.createdAt,
        plan: transaction.subscriptionPlan || 'BASIC',
      }));
      
      setBillingRecords(records);
    } catch (error) {
      console.error('Error loading billing data:', error);
      // Fallback to empty array on error
      setBillingRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return COLORS.success;
      case 'PENDING':
        return COLORS.warning;
      case 'OVERDUE':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'BASIC':
        return '#4CAF50';
      case 'PROFESSIONAL':
        return COLORS.primary;
      case 'ENTERPRISE':
        return '#9C27B0';
      default:
        return COLORS.textSecondary;
    }
  };

  const renderBillingRecord = ({ item }: { item: BillingRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{item.companyName}</Text>
          <View style={[styles.planBadge, { backgroundColor: getPlanColor(item.plan) }]}>
            <Text style={styles.planBadgeText}>{item.plan}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.recordDetails}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountText}>${item.amount.toLocaleString()}</Text>
        </View>
        <View style={styles.billingCycleContainer}>
          <Text style={styles.billingCycleLabel}>Billing Cycle</Text>
          <Text style={styles.billingCycleText}>
            {item.billingCycle || 'MONTHLY'}
          </Text>
        </View>
      </View>
      
      <View style={styles.dueDateContainer}>
        <Text style={styles.dueDateLabel}>Due Date:</Text>
        <Text style={styles.dueDateText}>
          {new Date(item.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );

  const renderFilterButton = (filter: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const filteredRecords = billingRecords.filter(record => 
    selectedFilter === 'ALL' || record.status === selectedFilter
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <SharedHeader variant="admin" title="" showLogo={false} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Billing Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SharedHeader
        variant="admin"
        title="Billing Management"
        showLogo={false}
      />
      
      <View style={styles.header}>
        <Text style={styles.subtitle}>Manage subscriptions and payments</Text>
        <TouchableOpacity
          style={styles.buyPlanButton}
          onPress={() => navigation.navigate('BuyPlan')}
          activeOpacity={0.7}
        >
          <Text style={styles.buyPlanButtonText}>View Plans →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('ALL', 'All')}
        {renderFilterButton('PAID', 'Paid')}
        {renderFilterButton('PENDING', 'Pending')}
        {renderFilterButton('OVERDUE', 'Overdue')}
      </View>

      <FlatList
        data={filteredRecords}
        renderItem={renderBillingRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No billing records found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    flex: 1,
  },
  buyPlanButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  buyPlanButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    gap: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterButtonTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxxxl,
  },
  emptyContainer: {
    padding: SPACING.xxxxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  recordCard: {
    backgroundColor: COLORS.backgroundPrimary,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  companyInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  companyName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  planBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textInverse,
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  amountText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  billingCycleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  billingCycleLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  billingCycleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  dueDateLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginRight: SPACING.xs,
  },
  dueDateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

export default BillingManagementScreen;
