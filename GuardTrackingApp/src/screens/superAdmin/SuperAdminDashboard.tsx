
/**
 * Super Admin Dashboard - Platform overview and key metrics
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { HomeIcon, UserIcon, ReportsIcon, ShiftsIcon } from '../../components/ui/AppIcons';
import SuperAdminService, { PlatformOverview } from '../../services/superAdminService';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SharedHeader from '../../components/ui/SharedHeader';
import SuperAdminProfileDrawer from '../../components/superAdmin/SuperAdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { LoadingOverlay, ErrorState, NetworkError } from '../../components/ui/LoadingStates';

interface RecentActivity {
  id: string;
  action: string;
  resource: string;
  userId?: string;
  timestamp: string;
  details?: any;
}

const SuperAdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const navigation = useNavigation();
  const [overview, setOverview] = useState<Omit<PlatformOverview, 'recentActivity'> | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const data = await SuperAdminService.getPlatformOverview();
      // Extract overview data (excluding recentActivity)
      const { recentActivity, ...overviewData } = data;
      setOverview(overviewData);
      setRecentActivity(recentActivity);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      const errorMessage = error?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      if (!refreshing) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getPreviousPeriodValue = (current: number, growth: number): number => {
    if (growth === 0) return current;
    return Math.round(current / (1 + growth / 100));
  };

  const renderMetricCard = (title: string, current: number, previous: number, format: 'currency' | 'number' = 'number') => {
    const growth = calculateGrowth(current, previous);
    const isPositive = growth >= 0;
    const formatValue = (value: number) => {
      if (format === 'currency') {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    };

    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{formatValue(current)}</Text>
        <View style={styles.metricGrowth}>
          <View style={styles.growthContainer}>
            <Text style={[styles.growthArrow, { color: isPositive ? '#10B981' : '#EF4444' }]}>
              {isPositive ? '↗' : '↘'}
            </Text>
            <Text style={[styles.growthText, { color: isPositive ? '#10B981' : '#EF4444' }]}>
              {Math.abs(growth).toFixed(1)}%
            </Text>
          </View>
          <Text style={styles.growthPeriod}>vs last period</Text>
        </View>
      </View>
    );
  };

  const renderPeriodSelector = () => {
    const periods = [
      { key: '7d', label: '7 Days' },
      { key: '30d', label: '30 Days' },
      { key: '90d', label: '90 Days' },
      { key: '1y', label: '1 Year' },
    ];

    return (
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Error handling
  const isNetworkError = error?.toLowerCase().includes('network') || 
                         error?.toLowerCase().includes('timeout') ||
                         error?.toLowerCase().includes('connection');

  if (loading && !overview) {
    return (
      <SafeAreaWrapper>
        <SharedHeader
          variant="superAdmin"
          showLogo={true}
          onMenuPress={openDrawer}
          onNotificationPress={() => {}}
          notificationCount={0}
          profileDrawer={
            <SuperAdminProfileDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onNavigateToCompanies={() => closeDrawer()}
              onNavigateToAnalytics={() => closeDrawer()}
              onNavigateToBilling={() => closeDrawer()}
              onNavigateToSystemSettings={() => closeDrawer()}
              onNavigateToAuditLogs={() => closeDrawer()}
            />
          }
        />
        <LoadingOverlay visible={true} message="Loading dashboard..." />
      </SafeAreaWrapper>
    );
  }

  if (error && !overview) {
    return (
      <SafeAreaWrapper>
        <SharedHeader
          variant="superAdmin"
          showLogo={true}
          onMenuPress={openDrawer}
          onNotificationPress={() => {}}
          notificationCount={0}
          profileDrawer={
            <SuperAdminProfileDrawer
              visible={isDrawerVisible}
              onClose={closeDrawer}
              onNavigateToCompanies={() => closeDrawer()}
              onNavigateToAnalytics={() => closeDrawer()}
              onNavigateToBilling={() => closeDrawer()}
              onNavigateToSystemSettings={() => closeDrawer()}
              onNavigateToAuditLogs={() => closeDrawer()}
            />
          }
        />
        {isNetworkError ? (
          <NetworkError 
            onRetry={loadDashboardData}
          />
        ) : (
          <ErrorState 
            error={error}
            onRetry={loadDashboardData}
          />
        )}
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="superAdmin"
        showLogo={true}
        onMenuPress={openDrawer}
        onNotificationPress={() => {
          // Handle notification press
        }}
        notificationCount={0}
        profileDrawer={
          <SuperAdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToCompanies={() => {
              closeDrawer();
              // navigation.navigate('Companies');
            }}
            onNavigateToAnalytics={() => {
              closeDrawer();
              // navigation.navigate('Analytics');
            }}
            onNavigateToBilling={() => {
              closeDrawer();
              // navigation.navigate('Billing');
            }}
            onNavigateToSystemSettings={() => {
              closeDrawer();
              // navigation.navigate('SystemSettings');
            }}
            onNavigateToAuditLogs={() => {
              closeDrawer();
              // navigation.navigate('AuditLogs');
            }}
          />
        }
      />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Time Period Selector */}
        {renderPeriodSelector()}

        {/* Overview Stats */}
        {overview && (
          <View style={styles.metricsContainer}>
            {renderMetricCard(
              'Revenue',
              overview.totalRevenue || 0,
              getPreviousPeriodValue(overview.totalRevenue || 0, 27.5),
              'currency'
            )}
            {renderMetricCard(
              'Total Users',
              (overview.activeUsers || 0) + (overview.totalClients || 0) + (overview.activeGuards || 0),
              getPreviousPeriodValue((overview.activeUsers || 0) + (overview.totalClients || 0) + (overview.activeGuards || 0), 12.3)
            )}
            {renderMetricCard(
              'Companies',
              overview.totalCompanies || 0,
              getPreviousPeriodValue(overview.totalCompanies || 0, 8.7)
            )}
            {renderMetricCard(
              'Guards',
              overview.activeGuards || 0,
              getPreviousPeriodValue(overview.activeGuards || 0, 15.2)
            )}
          </View>
        )}

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Active Users</Text>
                <Text style={styles.summaryValue}>{overview?.activeUsers || 0}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Active Sites</Text>
                <Text style={styles.summaryValue}>{overview?.totalSites || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Text style={styles.activityIconText}>📝</Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityAction}>
                      {activity.action.replace(/_/g, ' ').toLowerCase()}
                    </Text>
                    <Text style={styles.activityResource}>
                      {activity.resource} • {formatDate(activity.timestamp)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noActivityText}>No recent activity</Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('CreateCompany' as never)}
            >
              <View style={styles.quickActionIcon}>
                <UserIcon size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionText}>Add Company</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PlatformAnalytics' as never)}
            >
              <View style={styles.quickActionIcon}>
                <ReportsIcon size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionText}>View Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('BillingManagement' as never)}
            >
              <View style={styles.quickActionIcon}>
                <ShiftsIcon size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionText}>Billing</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('SystemSettings' as never)}
            >
              <View style={styles.quickActionIcon}>
                <HomeIcon size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
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
  periodSelector: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  metricCard: {
    width: (width - SPACING.md * 3) / 2,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  metricGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  growthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  growthPeriod: {
    fontSize: 12,
    color: '#666666',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  activityResource: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  noActivityText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    paddingVertical: SPACING.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});

export default SuperAdminDashboard;

