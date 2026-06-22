/**
 * Audit Logs Screen - System audit logs and activity tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { superAdminService, AuditLog } from '../../services/superAdminService';
import { hasMorePages } from '../../utils/paginationUtils';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import SuperAdminProfileDrawer from '../../components/superAdmin/SuperAdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import FormInput from '../../components/common/FormInput';

const AuditLogsScreen: React.FC = () => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: 'SuperAdminNotifications',
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadAuditLogs = useCallback(
    async (reset = false, pageOverride?: number) => {
      try {
        const currentPage = reset ? 1 : pageOverride ?? page;
        if (reset) setLoading(true);
        else setLoadingMore(true);

        const data = await superAdminService.getAuditLogs({
          page: currentPage,
          limit: 30,
          action: selectedFilter !== 'ALL' ? selectedFilter : undefined,
          search: debouncedSearch || undefined,
        });

        if (reset) {
          setAuditLogs(data.logs);
          setPage(1);
        } else {
          setAuditLogs((prev) => [...prev, ...data.logs]);
        }
        setHasMore(hasMorePages(data.pagination));
      } catch (error) {
        console.error('Error loading audit logs:', error);
        if (reset) setAuditLogs([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedFilter, debouncedSearch, page]
  );

  useEffect(() => {
    loadAuditLogs(true);
  }, [selectedFilter, debouncedSearch]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadAuditLogs(false, nextPage);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return COLORS.primary;
    if (action.includes('CREATE') || action.includes('ACTIVATE')) return COLORS.success;
    if (action.includes('SUSPEND') || action.includes('DELETE')) return COLORS.warning;
    if (action.includes('FAILED') || action.includes('ERROR')) return COLORS.error;
    return COLORS.textSecondary;
  };

  const renderAuditLog = ({ item }: { item: AuditLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={[styles.actionBadge, { backgroundColor: getActionColor(item.action) }]}>
          <Text style={styles.actionText}>{item.action}</Text>
        </View>
        <Text style={styles.timestampText}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
      <View style={styles.logContent}>
        <Text style={styles.resourceText}>{item.resource}</Text>
        <Text style={styles.userText}>by {item.userName || 'System'}</Text>
      </View>
      {item.newValues && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText} numberOfLines={4}>
            {typeof item.newValues === 'string'
              ? item.newValues
              : JSON.stringify(item.newValues, null, 2)}
          </Text>
        </View>
      )}
      <View style={styles.logFooter}>
        <Text style={styles.ipText}>IP: {item.ipAddress || 'N/A'}</Text>
      </View>
    </View>
  );

  const renderFilterButton = (filter: string, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
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

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="superAdmin"
        title="Audit Logs"
        onMenuPress={openDrawer}
        onNotificationPress={onNotificationPress}
        notificationCount={notificationCount}
        profileDrawer={
          <SuperAdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToAuditLogs={() => closeDrawer()}
          />
        }
      />

      <View style={styles.searchContainer}>
        <FormInput
          icon="search"
          placeholder="Search logs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('ALL', 'All')}
        {renderFilterButton('LOGIN', 'Auth')}
        {renderFilterButton('COMPANY', 'Company')}
        {renderFilterButton('USER', 'User')}
        {renderFilterButton('PAYMENT', 'Payment')}
      </View>

      {loading && auditLogs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={auditLogs}
          renderItem={renderAuditLog}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.footerLoader} color={COLORS.primary} /> : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No audit logs found</Text>
          }
        />
      )}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
  },
  searchInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    gap: SPACING.xs,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
  },
  filterButtonActive: { backgroundColor: COLORS.primary },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterButtonTextActive: { color: COLORS.textInverse },
  listContainer: { padding: SPACING.md, paddingBottom: SPACING.xxxxxl },
  logCard: {
    backgroundColor: COLORS.backgroundPrimary,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
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
  logContent: { marginBottom: SPACING.sm },
  resourceText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  userText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.sm,
    borderRadius: 6,
    marginBottom: SPACING.sm,
  },
  detailsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  logFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  ipText: { fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.textSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: COLORS.textSecondary, padding: SPACING.xl },
  footerLoader: { padding: SPACING.md },
});

export default AuditLogsScreen;
