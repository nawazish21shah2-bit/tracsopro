/**
 * Audit Logs Screen - System audit logs and activity tracking
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { superAdminService } from '../../services/superAdminService';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: any;
  ipAddress: string;
  userAgent: string;
}

const AuditLogsScreen: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await superAdminService.getAuditLogs({
        page: 1,
        limit: 50,
        action: selectedFilter !== 'ALL' ? selectedFilter : undefined,
      });
      
      // Transform backend data to frontend format
      const logs: AuditLog[] = (data.logs || []).map((log: any) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        userId: log.userId || 'system',
        userName: log.userId ? 'User' : 'System', // Could fetch user name if needed
        timestamp: log.timestamp,
        details: log.newValues || log.oldValues || {},
        ipAddress: log.ipAddress || 'N/A',
        userAgent: log.userAgent || 'N/A',
      }));
      
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
        return COLORS.primary;
      case 'COMPANY_CREATED':
      case 'USER_CREATED':
        return COLORS.success;
      case 'USER_SUSPENDED':
      case 'COMPANY_SUSPENDED':
        return COLORS.warning;
      case 'PAYMENT_FAILED':
      case 'ERROR':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderAuditLog = ({ item }: { item: AuditLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={[styles.actionBadge, { backgroundColor: getActionColor(item.action) }]}>
          <Text style={styles.actionText}>{item.action}</Text>
        </View>
        <Text style={styles.timestampText}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.logContent}>
        <Text style={styles.resourceText}>{item.resource}</Text>
        <Text style={styles.userText}>by {item.userName}</Text>
      </View>
      
      {item.details && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>
            {JSON.stringify(item.details, null, 2)}
          </Text>
        </View>
      )}
      
      <View style={styles.logFooter}>
        <Text style={styles.ipText}>IP: {item.ipAddress}</Text>
        <Text style={styles.idText}>ID: {item.id}</Text>
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

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'ALL' || 
      log.action.includes(selectedFilter) ||
      log.resource === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Audit Logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Logs</Text>
        <Text style={styles.subtitle}>System activity and security logs</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('ALL', 'All')}
        {renderFilterButton('LOGIN', 'Auth')}
        {renderFilterButton('COMPANY', 'Company')}
        {renderFilterButton('USER', 'User')}
        {renderFilterButton('PAYMENT', 'Payment')}
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderAuditLog}
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
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
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
  logCard: {
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
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  actionBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  timestampText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  logContent: {
    marginBottom: SPACING.sm,
  },
  resourceText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  userText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    backgroundColor: '#F3F4F6',
    padding: SPACING.sm,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  detailsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  idText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
});

export default AuditLogsScreen;
