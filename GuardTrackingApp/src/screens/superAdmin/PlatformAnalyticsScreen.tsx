/**
 * Platform Analytics Screen - Analytics and metrics for the platform
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import LineChart from 'react-native-chart-kit/dist/line-chart/LineChart';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { superAdminService, MetricGrowth, PlatformAnalyticsResponse } from '../../services/superAdminService';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SuperAdminProfileDrawer from '../../components/superAdmin/SuperAdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import { useNotificationBell } from '../../hooks/useNotificationBell';
import { ErrorState } from '../../components/ui/LoadingStates';

const CHART_HEIGHT = 220;
const CHART_LEFT_PADDING = 36;
const CHART_BOTTOM_PADDING = 20;

function prepareLineChartSeries(labels: string[], data: number[]) {
  const values = data.length ? data : [0];
  const maxValue = Math.max(...values, 0);

  return {
    labels,
    datasets: [{ data: values }],
    segments: maxValue === 0 ? 1 : 4,
    formatYLabel: (label: string) => {
      if (maxValue === 0) {
        return '0';
      }
      const numericLabel = Number(label);
      return Number.isFinite(numericLabel) ? String(Math.round(numericLabel)) : label;
    },
  };
}

const baseChartConfig = {
  backgroundColor: '#FFFFFF',
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(28, 108, 169, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(130, 130, 130, ${opacity})`,
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#E5E7EB',
    strokeWidth: 1,
  },
  propsForLabels: {
    fontSize: 9,
  },
};

type AnalyticsLineChartProps = {
  title: string;
  labels: string[];
  data: number[];
  width: number;
  color: (opacity?: number) => string;
};

const AnalyticsLineChart: React.FC<AnalyticsLineChartProps> = ({
  title,
  labels,
  data,
  width,
  color,
}) => {
  const series = useMemo(() => prepareLineChartSeries(labels, data), [labels, data]);
  const labelRotation = labels.length > 8 ? -40 : 0;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartPlot}>
        <LineChart
          data={{
            labels: series.labels,
            datasets: series.datasets,
          }}
          width={width}
          height={CHART_HEIGHT}
          chartConfig={{
            ...baseChartConfig,
            color,
            propsForDots: { ...baseChartConfig.propsForDots, stroke: color(1) },
          }}
          bezier
          fromZero
          style={[
            styles.chart,
            {
              paddingBottom: labelRotation ? 28 : CHART_BOTTOM_PADDING,
            },
          ]}
          withInnerLines
          withOuterLines={false}
          withVerticalLabels
          withHorizontalLabels
          withDots
          withShadow={false}
          segments={series.segments}
          formatYLabel={series.formatYLabel}
          yLabelsOffset={4}
          xLabelsOffset={-2}
          verticalLabelRotation={labelRotation}
        />
      </View>
    </View>
  );
};

const PlatformAnalyticsScreen: React.FC = () => {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - SPACING.md * 2 - SPACING.lg * 2;
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

  const revenueChart = analytics?.charts?.revenue;
  const usersChart = analytics?.charts?.users;

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
          <AnalyticsLineChart
            title="Revenue Trend"
            labels={revenueChart.labels}
            data={revenueChart.data}
            width={chartWidth}
            color={(opacity = 1) => `rgba(28, 108, 169, ${opacity})`}
          />
        )}

        {usersChart && usersChart.labels.length > 0 && (
          <AnalyticsLineChart
            title="User Growth"
            labels={usersChart.labels}
            data={usersChart.data}
            width={chartWidth}
            color={(opacity = 1) => `rgba(76, 175, 80, ${opacity})`}
          />
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
    width: '47%',
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
    marginBottom: SPACING.sm,
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  chartPlot: {
    width: '100%',
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  chart: {
    marginLeft: -SPACING.xs,
    borderRadius: 16,
    paddingRight: CHART_LEFT_PADDING,
    paddingBottom: CHART_BOTTOM_PADDING,
  },
});

export default PlatformAnalyticsScreen;
