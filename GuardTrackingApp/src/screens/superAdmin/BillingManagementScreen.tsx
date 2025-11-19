/**
 * Billing Management Screen - Billing and subscription management
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';

interface BillingRecord {
  id: string;
  companyName: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  plan: string;
}

const BillingManagementScreen: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      // Mock billing data
      const mockData: BillingRecord[] = [
        {
          id: '1',
          companyName: 'Elite Security Services',
          amount: 299,
          status: 'PAID',
          dueDate: '2024-12-15',
          plan: 'PROFESSIONAL',
        },
        {
          id: '2',
          companyName: 'Guardian Protection Co.',
          amount: 599,
          status: 'PENDING',
          dueDate: '2024-12-20',
          plan: 'ENTERPRISE',
        },
        {
          id: '3',
          companyName: 'SecureWatch Solutions',
          amount: 99,
          status: 'OVERDUE',
          dueDate: '2024-11-30',
          plan: 'BASIC',
        },
      ];
      setBillingRecords(mockData);
    } catch (error) {
      console.error('Error loading billing data:', error);
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

  const renderBillingRecord = ({ item }: { item: BillingRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.companyName}>{item.companyName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.recordDetails}>
        <Text style={styles.planText}>{item.plan} Plan</Text>
        <Text style={styles.amountText}>${item.amount}</Text>
      </View>
      <Text style={styles.dueDateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
    </View>
  );

  const renderFilterButton = (filter: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Billing Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Billing Management</Text>
        <Text style={styles.subtitle}>Manage subscriptions and payments</Text>
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
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
  listContainer: {
    padding: SPACING.md,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  companyName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  planText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  amountText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  dueDateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default BillingManagementScreen;
