/**
 * Live Activity Feed - Phase 5
 * Real-time shift updates, check-ins, and incident reports with filtering
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import WebSocketService from '../../services/WebSocketService';
import { ErrorHandler } from '../../utils/errorHandler';
import { AlertCircleIcon, AlertTriangleIcon, FileTextIcon, MapPinIcon, ClockIcon } from '../ui/FeatherIcons';
import { CheckCircleIcon, UserIcon } from '../ui/AppIcons';

interface ActivityItem {
  id: string;
  type: 'check_in' | 'check_out' | 'incident' | 'shift_start' | 'shift_end' | 'break_start' | 'break_end' | 'emergency';
  guardId: string;
  guardName: string;
  siteName: string;
  message: string;
  timestamp: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'resolved' | 'pending';
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface LiveActivityFeedProps {
  maxItems?: number;
  showFilters?: boolean;
  onActivityPress?: (activity: ActivityItem) => void;
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  maxItems = 50,
  showFilters = true,
  onActivityPress,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | ActivityItem['type']>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    initializeActivityFeed();
    setupWebSocketListeners();

    return () => {
      // Cleanup WebSocket listeners if needed
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, selectedFilter]);

  const initializeActivityFeed = async () => {
    try {
      // Load initial activities
      const initialActivities = generateMockActivities();
      setActivities(initialActivities);
      
      console.log('📊 Live activity feed initialized');
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_activity_feed');
    }
  };

  const setupWebSocketListeners = () => {
    // In a real implementation, you would set up WebSocket listeners here
    // For now, we'll simulate real-time updates
    const interval = setInterval(() => {
      if (isLive && Math.random() > 0.7) { // 30% chance of new activity
        addNewActivity();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  };

  const generateMockActivities = (): ActivityItem[] => {
    const mockActivities: ActivityItem[] = [
      {
        id: 'activity_1',
        type: 'check_in',
        guardId: 'guard_1',
        guardName: 'John Smith',
        siteName: 'Central Office',
        message: 'Checked in at Central Office',
        timestamp: Date.now() - 120000, // 2 minutes ago
      },
      {
        id: 'activity_2',
        type: 'incident',
        guardId: 'guard_2',
        guardName: 'Sarah Johnson',
        siteName: 'Warehouse A',
        message: 'Reported security breach incident',
        timestamp: Date.now() - 900000, // 15 minutes ago
        severity: 'high',
        status: 'pending',
      },
      {
        id: 'activity_3',
        type: 'shift_start',
        guardId: 'guard_3',
        guardName: 'Mike Wilson',
        siteName: 'Retail Store',
        message: 'Started shift at Retail Store',
        timestamp: Date.now() - 1800000, // 30 minutes ago
      },
      {
        id: 'activity_4',
        type: 'break_start',
        guardId: 'guard_1',
        guardName: 'John Smith',
        siteName: 'Central Office',
        message: 'Started break',
        timestamp: Date.now() - 2700000, // 45 minutes ago
      },
      {
        id: 'activity_5',
        type: 'emergency',
        guardId: 'guard_4',
        guardName: 'Lisa Davis',
        siteName: 'Shopping Mall',
        message: 'Emergency alert triggered',
        timestamp: Date.now() - 3600000, // 1 hour ago
        severity: 'critical',
        status: 'resolved',
      },
    ];

    return mockActivities.sort((a, b) => b.timestamp - a.timestamp);
  };

  const addNewActivity = () => {
    const activityTypes: ActivityItem['type'][] = [
      'check_in', 'check_out', 'incident', 'shift_start', 'shift_end', 'break_start', 'break_end'
    ];
    
    const guardNames = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Lisa Davis', 'Tom Brown'];
    const siteNames = ['Central Office', 'Warehouse A', 'Retail Store', 'Shopping Mall', 'Office Complex'];
    
    const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const randomGuard = guardNames[Math.floor(Math.random() * guardNames.length)];
    const randomSite = siteNames[Math.floor(Math.random() * siteNames.length)];
    
    const newActivity: ActivityItem = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: randomType,
      guardId: `guard_${Math.floor(Math.random() * 10)}`,
      guardName: randomGuard,
      siteName: randomSite,
      message: getActivityMessage(randomType, randomGuard, randomSite),
      timestamp: Date.now(),
      ...(randomType === 'incident' && {
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        status: 'pending' as any,
      }),
    };

    setActivities(prev => [newActivity, ...prev].slice(0, maxItems));
  };

  const getActivityMessage = (type: ActivityItem['type'], guardName: string, siteName: string): string => {
    switch (type) {
      case 'check_in': return `Checked in at ${siteName}`;
      case 'check_out': return `Checked out from ${siteName}`;
      case 'incident': return `Reported incident at ${siteName}`;
      case 'shift_start': return `Started shift at ${siteName}`;
      case 'shift_end': return `Ended shift at ${siteName}`;
      case 'break_start': return `Started break at ${siteName}`;
      case 'break_end': return `Ended break at ${siteName}`;
      case 'emergency': return `Emergency alert at ${siteName}`;
      default: return `Activity at ${siteName}`;
    }
  };

  const applyFilters = () => {
    if (selectedFilter === 'all') {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(activities.filter(activity => activity.type === selectedFilter));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const refreshedActivities = generateMockActivities();
      setActivities(refreshedActivities);
      setIsRefreshing(false);
    }, 1000);
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
    if (type === 'emergency' || severity === 'critical') return '#FEEBEB'; // Light red
    if (type === 'incident' && severity === 'high') return '#FFF4E6'; // Light orange
    if (type === 'incident' && severity === 'medium') return '#FFF8E1'; // Light yellow
    if (type === 'check_in' || type === 'shift_start') return '#E8F5E9'; // Light green
    if (type === 'check_out' || type === 'shift_end') return '#E3F2FD'; // Light blue
    return '#F5F5F5'; // Light gray
  };

  const getActivityIconColor = (type: ActivityItem['type'], severity?: string) => {
    if (type === 'emergency' || severity === 'critical') return COLORS.error;
    if (type === 'incident' && severity === 'high') return '#FF8800';
    if (type === 'incident' && severity === 'medium') return COLORS.warning;
    if (type === 'check_in' || type === 'shift_start') return COLORS.success;
    if (type === 'check_out' || type === 'shift_end') return COLORS.info;
    return COLORS.textSecondary;
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
    const now = Date.now();
    const diff = now - timestamp;
    
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
            <Text style={[
              styles.filterButtonText,
              selectedFilter === option.key && styles.filterButtonTextActive,
            ]}>
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
      <View style={[
        styles.activityIcon,
        {
          backgroundColor: getActivityIconBgColor(item.type, item.severity),
        }
      ]}>
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
          {item.severity && (
            <View style={[
              styles.severityBadge,
              { backgroundColor: getActivityColor(item.type, item.severity) }
            ]}>
              <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={[
        styles.activityIndicator,
        { backgroundColor: getActivityColor(item.type, item.severity) }
      ]} />
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Live Activity</Text>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: isLive ? COLORS.success : COLORS.error }]} />
          <Text style={styles.liveText}>{isLive ? 'LIVE' : 'PAUSED'}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.liveToggle}
        onPress={() => setIsLive(!isLive)}
      >
        <Text style={styles.liveToggleText}>{isLive ? 'Pause' : 'Resume'}</Text>
      </TouchableOpacity>
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
export type { ActivityItem };
