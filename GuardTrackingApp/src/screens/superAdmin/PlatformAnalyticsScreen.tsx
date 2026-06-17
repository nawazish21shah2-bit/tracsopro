/**
 * Platform Analytics Screen - Analytics and metrics for the platform
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import LineChart from 'react-native-chart-kit/dist/line-chart/LineChart';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { superAdminService, MetricGrowth, PlatformAnalyticsResponse } from '../../services/superAdminService';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SuperAdminProfileDrawer from '../../components/superAdmin/SuperAdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { ErrorState } from '../../components/ui/LoadingStates';

const { width } = Dimensions.get('window');

const PlatformAnalyticsScreen: React.FC = () => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const { onNotificationPress, notificationCount } = useNotificationBell({
    notificationsRoute: 'SuperAdminNotifications',
  });
  const [analytics, setAnalytics] = useState<PlatformAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminService.getPlatformAnalytics({ period: selectedPeriod });
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (
    title: string,
    data: MetricGrowth,
    format: 'currency' | 'number'
  ) => {
    const isPositive = data.growth >= 0;
    const formatValue = (value: number) => {
      if (format === 'currency') {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    };

    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{formatValue(data.current)}</Text>
        <View style={styles.metricGrowth}>
          <Text style={[styles.growthText, { color: isPositive ? COLORS.success : COLORS.error }]}>
            {isPositive ? '↗' : '↘'} {Math.abs(data.growth)}%
          </Text>
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

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(28, 108, 169, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(130, 130, 130, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E5E7EB',
      strokeWidth: 1,
    },
  };

  if (loading && !analytics) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (error && !analytics) {
    return (
      <SafeAreaWrapper>
        <SharedHeader variant="superAdmin" title="Platform Analytics" onMenuPress={openDrawer} />
        <ErrorState error={error} onRetry={loadAnalytics} />
      </SafeAreaWrapper>
    );
  }

  const revenueChart = analytics?.charts?.revenue;
  const usersChart = analytics?.charts?.users;

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="superAdmin"
        title="Platform Analytics"
        onMenuPress={openDrawer}
        onNotificationPress={onNotificationPress}
        notificationCount={notificationCount}
        profileDrawer={
          <SuperAdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToAnalytics={() => closeDrawer()}
          />
        }
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderPeriodSelector()}

        {analytics?.summary && (
          <View style={styles.metricsContainer}>
            {renderMetricCard('Revenue', analytics.summary.revenue, 'currency')}
            {renderMetricCard('Total Users', analytics.summary.users, 'number')}
            {renderMetricCard('Companies', analytics.summary.companies, 'number')}
            {renderMetricCard('Guards', analytics.summary.guards, 'number')}
          </View>
        )}

        {revenueChart && revenueChart.labels.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenue Trend</Text>
            <LineChart
              data={{
                labels: revenueChart.labels,
                datasets: [{ data: revenueChart.data.length ? revenueChart.data : [0] }],
              }}
              width={width - SPACING.md * 4}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines={false}
              withVerticalLabels
              withHorizontalLabels
              withDots
              withShadow={false}
              segments={4}
            />
          </View>
        )}

        {usersChart && usersChart.labels.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>User Growth</Text>
            <LineChart
              data={{
                labels: usersChart.labels,
                datasets: [{ data: usersChart.data.length ? usersChart.data : [0] }],
              }}
              width={width - SPACING.md * 4}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              }}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines={false}
              withVerticalLabels
              withHorizontalLabels
              withDots
              withShadow={false}
              segments={4}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundPrimary,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
  },
  periodButtonActive: { backgroundColor: COLORS.primary },
  periodButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  periodButtonTextActive: { color: COLORS.textInverse },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  metricCard: {
    width: (width - SPACING.md * 3) / 2,
    backgroundColor: COLORS.backgroundPrimary,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  metricTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  metricGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  growthText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  growthPeriod: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  chartCard: {
    backgroundColor: COLORS.backgroundPrimary,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: 16,
  },
});

export default PlatformAnalyticsScreen;
