/**
 * Live Activity Feed
 * Real-time shift updates, check-ins, incidents, and emergency alerts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { AlertCircleIcon, AlertTriangleIcon, FileTextIcon, ClockIcon } from '../ui/FeatherIcons';
import { CheckCircleIcon, UserIcon } from '../ui/AppIcons';
import operationsService, { OperationsActivityItem } from '../../services/operationsService';

export interface ActivityItem extends OperationsActivityItem {}

interface LiveActivityFeedProps {
  maxItems?: number;
  showFilters?: boolean;
  onActivityPress?: (activity: ActivityItem) => void;
  /** Load from /admin/operations/activity (Operations Center) */
  useOperationsApi?: boolean;
  /** Set false when rendered inside a parent ScrollView */
  scrollEnabled?: boolean;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  maxItems = 50,
  showFilters = true,
  onActivityPress,
  useOperationsApi = false,
  scrollEnabled = true,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ActivityItem['type']>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadActivities = useCallback(async () => {
    if (!useOperationsApi) {
      setActivities([]);
      setLoadError(null);
      return;
    }

    try {
      setLoadError(null);
      const data = await operationsService.getOperationsActivity(maxItems);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activity feed:', error);
      setLoadError('Failed to load activity');
    }
  }, [maxItems, useOperationsApi]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    if (!useOperationsApi || !isLive) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(() => {
      loadActivities();
    }, 15000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isLive, loadActivities, useOperationsApi]);

  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter((activity) => activity.type === selectedFilter));
    }
  }, [activities, selectedFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    const iconSize = 20;
    switch (type) {
      case 'check_in':
        return <UserIcon size={iconSize} color={COLORS.success} />;
      case 'check_out':
        return <CheckCircleIcon size={iconSize} color={COLORS.info} />;
      case 'incident':
        return <AlertTriangleIcon size={iconSize} color={COLORS.warning} />;
      case 'shift_start':
        return <CheckCircleIcon size={iconSize} color={COLORS.success} />;
      case 'shift_end':
        return <AlertCircleIcon size={iconSize} color={COLORS.error} />;
      case 'break_start':
      case 'break_end':
        return <ClockIcon size={iconSize} color={COLORS.textSecondary} />;
      case 'emergency':
        return <AlertCircleIcon size={iconSize} color={COLORS.error} />;
      default:
        return <FileTextIcon size={iconSize} color={COLORS.textSecondary} />;
    }
  };

  const getActivityIconBgColor = (type: ActivityItem['type'], severity?: string) => {
    if (type === 'emergency' || severity === 'critical') return '#FEEBEB';
    if (type === 'incident' && severity === 'high') return '#FFF4E6';
    if (type === 'incident' && severity === 'medium') return '#FFF8E1';
    if (type === 'check_in' || type === 'shift_start') return '#E8F5E9';
    if (type === 'check_out' || type === 'shift_end') return '#E3F2FD';
    return '#F5F5F5';
  };

  const getActivityColor = (type: ActivityItem['type'], severity?: string) => {
    if (type === 'emergency' || severity === 'critical') return COLORS.error;
    if (type === 'incident' && severity === 'high') return '#FF8800';
    if (type === 'incident' && severity === 'medium') return COLORS.warning;
    if (type === 'check_in' || type === 'shift_start') return COLORS.success;
    if (type === 'check_out' || type === 'shift_end') return COLORS.info;
    return COLORS.textSecondary;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderFilterButtons = () => {
    if (!showFilters) return null;

    const filterOptions: { key: 'all' | ActivityItem['type']; label: string }[] = [
      { key: 'all', label: 'All' },
      { key: 'check_in', label: 'Check-ins' },
      { key: 'incident', label: 'Incidents' },
      { key: 'emergency', label: 'Emergency' },
      { key: 'shift_start', label: 'Shifts' },
    ];

    return (
      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterButton,
              selectedFilter === option.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(option.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === option.key && styles.filterButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => onActivityPress?.(item)}
    >
      <View
        style={[
          styles.activityIcon,
          { backgroundColor: getActivityIconBgColor(item.type, item.severity) },
        ]}
      >
        {getActivityIcon(item.type)}
      </View>

      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={styles.guardName}>{item.guardName}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(item.timestamp)}</Text>
        </View>

        <Text style={styles.activityMessage}>{item.message}</Text>

        <View style={styles.activityFooter}>
          <Text style={styles.siteName}>{item.siteName}</Text>
          {item.severity ? (
            <View
              style={[
                styles.severityBadge,
                { backgroundColor: getActivityColor(item.type, item.severity) },
              ]}
            >
              <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.activityIndicator,
          { backgroundColor: getActivityColor(item.type, item.severity) },
        ]}
      />
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (!useOperationsApi) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Activity feed unavailable</Text>
          <Text style={styles.emptySubtitle}>Connect this view to live operations data.</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          {loadError ? 'Could not load activity' : 'No recent activity'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {loadError
            ? 'Pull to refresh or check your connection.'
            : 'Check-ins, incidents, and emergencies will appear here.'}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Live Activity</Text>
        {useOperationsApi ? (
          <View style={styles.liveIndicator}>
            <View
              style={[styles.liveDot, { backgroundColor: isLive ? COLORS.success : COLORS.error }]}
            />
            <Text style={styles.liveText}>{isLive ? 'LIVE' : 'PAUSED'}</Text>
          </View>
        ) : null}
      </View>

      {useOperationsApi ? (
        <TouchableOpacity style={styles.liveToggle} onPress={() => setIsLive(!isLive)}>
          <Text style={styles.liveToggleText}>{isLive ? 'Pause' : 'Resume'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilterButtons()}

      <FlatList
        data={filteredActivities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled={!scrollEnabled}
        refreshControl={
          useOperationsApi && scrollEnabled ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          ) : undefined
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredActivities.length === 0 && styles.listContentEmpty,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPrimary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.xs,
  },
  liveText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  liveToggle: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
  },
  liveToggleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textInverse,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.backgroundSecondary,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.regular,
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.small,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  guardName: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  activityMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  severityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  activityIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
});

export default LiveActivityFeed;
