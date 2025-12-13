import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import { settingsService } from '../../services/settingsService';
import * as theme from '../../styles/globalStyles';
import { MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'react-native-feather';

// Safely access design tokens for StyleSheet.create
const COLORS = theme.COLORS || {
  backgroundPrimary: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  primary: '#1C6CA9',
  success: '#4CAF50',
  warning: '#FF9800',
};
const TYPOGRAPHY = theme.TYPOGRAPHY || {
  fontSize: { xs: 12, sm: 14, md: 15, lg: 18 },
  fontWeight: { medium: '500' as const, semibold: '600' as const },
};
const SPACING = theme.SPACING || { xs: 4, sm: 8, md: 12, lg: 16, xxl: 32 };
const BORDER_RADIUS = theme.BORDER_RADIUS || { sm: 8, md: 12 };

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt?: string;
}

interface SupportTicketListScreenProps {
  variant?: 'client' | 'guard' | 'admin';
  profileDrawer?: React.ReactNode;
}

const SupportTicketListScreen: React.FC<SupportTicketListScreenProps> = ({
  variant = 'client',
  profileDrawer,
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await settingsService.getSupportTickets(pageNum, 20);
      
      if (refresh || pageNum === 1) {
        setTickets(result.tickets);
      } else {
        setTickets(prev => [...prev, ...result.tickets]);
      }

      setPage(result.pagination.page);
      setTotalPages(result.pagination.pages);
      setHasMore(result.pagination.page < result.pagination.pages);
    } catch (error: any) {
      console.error('Error loading support tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadTickets(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadTickets(page + 1, false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock width={16} height={16} stroke={COLORS.warning} />;
      case 'IN_PROGRESS':
        return <AlertCircle width={16} height={16} stroke={COLORS.primary} />;
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle width={16} height={16} stroke={COLORS.success} />;
      default:
        return <MessageCircle width={16} height={16} stroke={COLORS.textSecondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return COLORS.warning;
      case 'IN_PROGRESS':
        return COLORS.primary;
      case 'RESOLVED':
      case 'CLOSED':
        return COLORS.success;
      default:
        return COLORS.textSecondary;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'TECHNICAL': 'Technical',
      'BILLING': 'Billing',
      'GENERAL': 'General',
      'URGENT': 'Urgent',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const renderTicket = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity style={styles.ticketCard} activeOpacity={0.7}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketTitleRow}>
          <Text style={styles.ticketSubject} numberOfLines={1}>
            {item.subject}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            {getStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <View style={styles.ticketMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.ticketMessage} numberOfLines={2}>
        {item.message}
      </Text>
    </TouchableOpacity>
  );

  if (loading && tickets.length === 0) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant={variant} title="Support Tickets" profileDrawer={profileDrawer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader variant={variant} title="Support Tickets" profileDrawer={profileDrawer} />
      <View style={styles.container}>
        {tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle width={48} height={48} stroke={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No support tickets yet</Text>
            <Text style={styles.emptySubtext}>
              Submit a support request from the Contact Support screen
            </Text>
          </View>
        ) : (
          <FlatList
            data={tickets}
            renderItem={renderTicket}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketHeader: {
    marginBottom: SPACING.sm,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  ticketSubject: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    textTransform: 'capitalize',
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  ticketMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footerLoader: {
    padding: SPACING.md,
    alignItems: 'center',
  },
});

export default SupportTicketListScreen;

