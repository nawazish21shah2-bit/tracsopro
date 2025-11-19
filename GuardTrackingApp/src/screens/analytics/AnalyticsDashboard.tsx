
/**
 * Advanced Analytics Dashboard
 * Comprehensive analytics and insights for guard performance and operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { AppScreen } from '../../components/common/AppScreen';
import { AppHeader } from '../../components/common/AppHeader';
import { AppCard } from '../../components/common/AppCard';
import StatsCard from '../../components/ui/StatsCard';
import { LoadingOverlay, ErrorState, InlineLoading } from '../../components/ui/LoadingStates';
import {
  ClockIcon,
  MapPinIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from '../../components/ui/FeatherIcons';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import { RootState } from '../../store';
import { ErrorHandler, withRetry } from '../../utils/errorHandler';
import { PerformanceOptimizer } from '../../utils/performanceOptimizer';

const { width: screenWidth } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: COLORS.backgroundPrimary,
  backgroundGradientFrom: COLORS.backgroundPrimary,
  backgroundGradientTo: COLORS.backgroundSecondary,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(28, 108, 169, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: COLORS.primary,
  },
};

interface AnalyticsData {
  shiftMetrics: {
    totalShifts: number;
    completedShifts: number;
    averageDuration: number;
    onTimePercentage: number;
  };
  locationMetrics: {
    sitesVisited: number;
    totalDistance: number;
    averageAccuracy: number;
    geofenceEvents: number;
  };
  incidentMetrics: {
    totalIncidents: number;
    resolvedIncidents: number;
    averageResponseTime: number;
    severityBreakdown: { [key: string]: number };
  };
  performanceMetrics: {
    attendanceRate: number;
    punctualityScore: number;
    complianceScore: number;
    overallRating: number;
  };
  timeSeriesData: {
    labels: string[];
    shiftsData: number[];
    incidentsData: number[];
    performanceData: number[];
  };
}

const AnalyticsDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'shifts' | 'incidents' | 'performance'>('shifts');

  useEffect(() => {
    PerformanceOptimizer.startRenderMeasurement();
    initializeAnalytics();

    return () => {
      PerformanceOptimizer.endRenderMeasurement('AnalyticsDashboard');
    };
  }, [selectedPeriod]);

  const initializeAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      await withRetry(async () => {
        const data = await fetchAnalyticsData(selectedPeriod);
        setAnalyticsData(data);
      }, 3, 1000);
    } catch (error: any) {
      const appError = ErrorHandler.handleError(error, 'fetch_analytics_data');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async (period: string): Promise<AnalyticsData> => {
    PerformanceOptimizer.startApiMeasurement('analytics_data');

    // Simulate API call - replace with actual API integration
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

    PerformanceOptimizer.endApiMeasurement('analytics_data');

    // Mock data - replace with real data from backend
    return {
      shiftMetrics: {
        totalShifts: 45,
        completedShifts: 42,
        averageDuration: 8.5,
        onTimePercentage: 93.3,
      },
      locationMetrics: {
        sitesVisited: 12,
        totalDistance: 245.8,
        averageAccuracy: 4.2,
        geofenceEvents: 156,
      },
      incidentMetrics: {
        totalIncidents: 8,
        resolvedIncidents: 7,
        averageResponseTime: 12.5,
        severityBreakdown: {
          low: 4,
          medium: 3,
          high: 1,
          critical: 0,
        },
      },
      performanceMetrics: {
        attendanceRate: 96.7,
        punctualityScore: 94.2,
        complianceScore: 98.1,
        overallRating: 4.6,
      },
      timeSeriesData: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        shiftsData: [10, 12, 11, 14],
        incidentsData: [2, 1, 3, 2],
        performanceData: [4.2, 4.5, 4.4, 4.8],
      },
    };
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await initializeAnalytics();
    } catch (error: any) {
      ErrorHandler.handleError(error, 'refresh_analytics_data', false);
    } finally {
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter') => {
    setSelectedPeriod(period);
  };

  const handleMetricChange = (metric: 'shifts' | 'incidents' | 'performance') => {
    setSelectedMetric(metric);
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'quarter'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive,
          ]}
          onPress={() => handlePeriodChange(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive,
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMetricCards = () => {
    if (!analyticsData) return null;

    const { shiftMetrics, locationMetrics, incidentMetrics } = analyticsData;

    return (
      <View style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          <StatsCard
            label="Completed Shifts"
            value={shiftMetrics.completedShifts}
            icon={<CheckCircleIcon size={18} color={COLORS.success} />}
            variant="success"
            style={styles.metricCard}
          />
          <StatsCard
            label="Avg Duration (h)"
            value={shiftMetrics.averageDuration.toFixed(1)}
            icon={<ClockIcon size={18} color={COLORS.primary} />}
            variant="info"
            style={styles.metricCard}
          />
        </View>

        <View style={styles.metricsRow}>
          <StatsCard
            label="Sites Visited"
            value={locationMetrics.sitesVisited}
            icon={<MapPinIcon size={18} color={COLORS.info} />}
            variant="info"
            style={styles.metricCard}
          />
          <StatsCard
            label="Incidents"
            value={incidentMetrics.totalIncidents}
            icon={<AlertTriangleIcon size={18} color={COLORS.warning} />}
            variant="danger"
            style={styles.metricCard}
          />
        </View>
      </View>
    );
  };

  const renderPerformanceScore = () => {
    if (!analyticsData) return null;

    const { performanceMetrics } = analyticsData;
    const scoreColor =
      performanceMetrics.overallRating >= 4.5
        ? COLORS.success
        : performanceMetrics.overallRating >= 3.5
        ? COLORS.warning
        : COLORS.error;

    return (
      <AppCard style={styles.performanceCard}>
        <View style={styles.performanceHeader}>
          <Text style={styles.sectionTitle}>Performance Score</Text>
          <View style={styles.overallScore}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {performanceMetrics.overallRating.toFixed(1)}
            </Text>
            <Text style={styles.scoreMax}>/5.0</Text>
          </View>
        </View>

        <View style={styles.performanceMetrics}>
          <View style={styles.performanceMetric}>
            <Text style={styles.performanceLabel}>Attendance</Text>
            <View style={styles.performanceBar}>
              <View
                style={[
                  styles.performanceBarFill,
                  { width: `${performanceMetrics.attendanceRate}%` },
                ]}
              />
            </View>
            <Text style={styles.performanceValue}>
              {performanceMetrics.attendanceRate}%
            </Text>
          </View>

          <View style={styles.performanceMetric}>
            <Text style={styles.performanceLabel}>Punctuality</Text>
            <View style={styles.performanceBar}>
              <View
                style={[
                  styles.performanceBarFill,
                  { width: `${performanceMetrics.punctualityScore}%` },
                ]}
              />
            </View>
            <Text style={styles.performanceValue}>
              {performanceMetrics.punctualityScore}%
            </Text>
          </View>

          <View style={styles.performanceMetric}>
            <Text style={styles.performanceLabel}>Compliance</Text>
            <View style={styles.performanceBar}>
              <View
                style={[
                  styles.performanceBarFill,
                  { width: `${performanceMetrics.complianceScore}%` },
                ]}
              />
            </View>
            <Text style={styles.performanceValue}>
              {performanceMetrics.complianceScore}%
            </Text>
          </View>
        </View>
      </AppCard>
    );
  };

  const renderChart = () => {
    if (!analyticsData) return null;

    const { timeSeriesData } = analyticsData;
    let chartData;
    let chartTitle;

    switch (selectedMetric) {
      case 'shifts':
        chartData = timeSeriesData.shiftsData;
        chartTitle = 'Shifts Completed';
        break;
      case 'incidents':
        chartData = timeSeriesData.incidentsData;
        chartTitle = 'Incidents Reported';
        break;
      case 'performance':
        chartData = timeSeriesData.performanceData;
        chartTitle = 'Performance Rating';
        break;
      default:
        chartData = timeSeriesData.shiftsData;
        chartTitle = 'Shifts Completed';
    }

    return (
      <AppCard style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>{chartTitle} Trend</Text>
          <View style={styles.metricSelector}>
            {(['shifts', 'incidents', 'performance'] as const).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.metricButton,
                  selectedMetric === metric && styles.metricButtonActive,
                ]}
                onPress={() => handleMetricChange(metric)}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    selectedMetric === metric && styles.metricButtonTextActive,
                  ]}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <LineChart
          data={{
            labels: timeSeriesData.labels,
            datasets: [
              {
                data: chartData,
                strokeWidth: 3,
              },
            ],
          }}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </AppCard>
    );
  };

  const renderIncidentBreakdown = () => {
    if (!analyticsData) return null;

    const { incidentMetrics } = analyticsData;
    const { severityBreakdown } = incidentMetrics;

    const pieData = Object.entries(severityBreakdown).map(
      ([severity, count], index) => ({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        population: count,
        color: [
          COLORS.success,
          COLORS.warning,
          COLORS.error,
          COLORS.textSecondary,
        ][index],
        legendFontColor: COLORS.textPrimary,
        legendFontSize: 12,
      })
    );

    return (
      <AppCard style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Incident Severity Breakdown</Text>

        {pieData.some((item) => item.population > 0) ? (
          <PieChart
            data={pieData}
            width={screenWidth - 60}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <CheckCircleIcon size={48} color={COLORS.success} />
            <Text style={styles.noDataText}>No incidents reported</Text>
            <Text style={styles.noDataSubtext}>
              Great job maintaining security!
            </Text>
          </View>
        )}
      </AppCard>
    );
  };

  if (loading && !analyticsData) {
    return (
      <AppScreen>
        <AppHeader title="Analytics Dashboard" showBack />
        <LoadingOverlay visible={true} message="Loading analytics..." />
      </AppScreen>
    );
  }

  if (error && !analyticsData) {
    return (
      <AppScreen>
        <AppHeader title="Analytics Dashboard" showBack />
        <ErrorState
          error={error}
          onRetry={initializeAnalytics}
          style={styles.errorContainer}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader title="Analytics Dashboard" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && analyticsData && (
          <InlineLoading
            message="Updating analytics..."
            style={styles.inlineLoading}
          />
        )}

        {renderPeriodSelector()}
        {renderMetricCards()}
        {renderPerformanceScore()}
        {renderChart()}
        {renderIncidentBreakdown()}
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  inlineLoading: {
    marginBottom: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: COLORS.textInverse,
  },
  metricsGrid: {
    marginBottom: SPACING.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  metricCard: {
    flex: 1,
  },
  performanceCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
  },
  overallScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  scoreMax: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  performanceMetrics: {
    gap: SPACING.md,
  },
  performanceMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  performanceLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    width: 80,
  },
  performanceBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  performanceValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    width: 40,
    textAlign: 'right',
  },
  chartCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.xs,
  },
  metricButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 6,
  },
  metricButtonActive: {
    backgroundColor: COLORS.primary,
  },
  metricButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textSecondary,
  },
  metricButtonTextActive: {
    color: COLORS.textInverse,
  },
  chart: {
    marginVertical: SPACING.sm,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noDataText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  noDataSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default AnalyticsDashboard;

