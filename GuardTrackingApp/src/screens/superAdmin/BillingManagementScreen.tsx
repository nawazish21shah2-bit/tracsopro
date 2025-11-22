/**
 * Billing Management Screen - Billing and subscription management
 * Updated UI to match app design system
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import SharedHeader from '../../components/ui/SharedHeader';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SuperAdminStackParamList } from '../../navigation/SuperAdminNavigator';
import { superAdminService } from '../../services/superAdminService';
import { SearchIcon } from '../../components/ui/AppIcons';

interface BillingRecord {
  id: string;
  companyName: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  dueDate: string;
  paidDate?: string;
  plan: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  type?: string;
  description?: string;
  invoiceNumber?: string;
  securityCompany?: {
    id: string;
    name: string;
    email: string;
  };
}

type NavigationProp = StackNavigationProp<SuperAdminStackParamList>;

const BillingManagementScreen: React.FC<{ navigation?: any }> = ({ navigation: navProp }) => {
  const navigation = useNavigation<NavigationProp>();
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadBillingData();
    loadAnalytics();
  }, [selectedFilter, searchQuery]);

  const loadAnalytics = async () => {
    try {
      const data = await superAdminService.getPaymentAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadBillingData = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setRefreshing(true);
      }

      const currentPage = reset ? 1 : page;
      const response = await superAdminService.getPaymentRecords({
        page: currentPage,
        limit: 20,
        status: selectedFilter !== 'ALL' ? selectedFilter : undefined,
        search: searchQuery || undefined,
      });
      
      // Transform backend data to frontend format
      const records: BillingRecord[] = (response.records || []).map((transaction: any) => ({
        id: transaction.id,
        companyName: transaction.securityCompany?.name || 'Unknown Company',
        amount: transaction.amount || 0,
        status: transaction.status || 'PENDING',
        dueDate: transaction.dueDate || transaction.createdAt,
        paidDate: transaction.paidDate,
        plan: transaction.securityCompany?.subscriptionPlan || 'BASIC',
        type: transaction.type,
        description: transaction.description,
        invoiceNumber: transaction.invoiceNumber,
        securityCompany: transaction.securityCompany,
      }));
      
      if (reset) {
        setBillingRecords(records);
      } else {
        setBillingRecords(prev => [...prev, ...records]);
      }
      
      setHasMore(response.pagination.pages > currentPage);
    } catch (error) {
      console.error('Error loading billing data:', error);
      Alert.alert('Error', 'Failed to load payment records');
      if (reset) {
        setBillingRecords([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadBillingData(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => {
        const nextPage = prev + 1;
        loadBillingData(false);
        return nextPage;
      });
    }
  };

  const handleMarkAsPaid = async (recordId: string) => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this payment as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              setProcessing(recordId);
              await superAdminService.updatePaymentStatus(recordId, 'PAID', new Date().toISOString());
              Alert.alert('Success', 'Payment marked as paid');
              loadBillingData(true);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to update payment status');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (recordId: string) => {
    navigation.navigate('PaymentDetail', { paymentId: recordId });
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
    <TouchableOpacity 
      style={styles.recordCard}
      onPress={() => handleViewDetails(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.recordHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{item.companyName}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.planBadge, { backgroundColor: getPlanColor(item.plan) }]}>
              <Text style={styles.planBadgeText}>{item.plan}</Text>
            </View>
            {item.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.description} numberOfLines={1}>
          {item.description}
        </Text>
      )}
      
      <View style={styles.recordDetails}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountText}>${item.amount.toLocaleString()}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>
            {item.status === 'PAID' ? 'Paid Date:' : 'Due Date:'}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.paidDate || item.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>
      
      {item.invoiceNumber && (
        <View style={styles.invoiceContainer}>
          <Text style={styles.invoiceLabel}>Invoice:</Text>
          <Text style={styles.invoiceText}>{item.invoiceNumber}</Text>
        </View>
      )}

      {item.status === 'PENDING' && (
        <TouchableOpacity
          style={styles.markPaidButton}
          onPress={() => handleMarkAsPaid(item.id)}
          disabled={processing === item.id}
        >
          {processing === item.id ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.markPaidButtonText}>Mark as Paid</Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company, invoice, or description..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Analytics Summary */}
      {analytics && (
        <View style={styles.analyticsContainer}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Total Revenue</Text>
            <Text style={styles.analyticsValue}>
              ${analytics.totalRevenue?.amount?.toLocaleString() || '0'}
            </Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Monthly Revenue</Text>
            <Text style={styles.analyticsValue}>
              ${analytics.monthlyRevenue?.amount?.toLocaleString() || '0'}
            </Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Pending</Text>
            <Text style={styles.analyticsValue}>
              ${analytics.byStatus?.find((s: any) => s.status === 'PENDING')?.amount?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.analyticsSubtext}>
              {analytics.byStatus?.find((s: any) => s.status === 'PENDING')?.count || 0} payments
            </Text>
          </View>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsLabel}>Overdue</Text>
            <Text style={[styles.analyticsValue, { color: COLORS.error }]}>
              ${analytics.byStatus?.find((s: any) => s.status === 'OVERDUE')?.amount?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.analyticsSubtext}>
              {analytics.byStatus?.find((s: any) => s.status === 'OVERDUE')?.count || 0} payments
            </Text>
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        {renderFilterButton('ALL', 'All')}
        {renderFilterButton('PAID', 'Paid')}
        {renderFilterButton('PENDING', 'Pending')}
        {renderFilterButton('OVERDUE', 'Overdue')}
      </View>

      <FlatList
        data={billingRecords}
        renderItem={renderBillingRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No payment records found'}
            </Text>
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
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  typeBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  invoiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.sm,
  },
  invoiceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginRight: SPACING.xs,
  },
  invoiceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  markPaidButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: `${COLORS.success}15`,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  markPaidButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.success,
  },
  analyticsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    gap: SPACING.md,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  analyticsValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  analyticsSubtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
});

export default BillingManagementScreen;
