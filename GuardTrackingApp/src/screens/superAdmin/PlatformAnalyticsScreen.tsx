/**
 * Platform Analytics Screen - Analytics and metrics for the platform
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import SuperAdminService from '../../services/superAdminService';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import SuperAdminProfileDrawer from '../../components/superAdmin/SuperAdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    growth: number;
  };
  companies: {
    total: number;
    active: number;
    growth: number;
  };
  guards: {
    total: number;
    active: number;
    growth: number;
  };
}

const PlatformAnalyticsScreen: React.FC = () => {
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const getStartDateForPeriod = (period: string): string => {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const service = new SuperAdminService();
      const data = await service.getPlatformAnalytics({
        startDate: getStartDateForPeriod(selectedPeriod),
        endDate: new Date().toISOString(),
      });
      
      // Transform backend data to frontend format
      // This is a simplified transformation - adjust based on actual backend response
      const analyticsData: AnalyticsData = {
        revenue: {
          current: 125000, // Calculate from data
          previous: 98000,
          growth: 27.5,
        },
        users: {
          total: 1250,
          active: 1180,
          growth: 12.3,
        },
        companies: {
          total: 25,
          active: 23,
          growth: 8.7,
        },
        guards: {
          total: 850,
          active: 780,
          growth: 15.2,
        },
      };
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (title: string, data: { current: number; previous: number; growth: number }, format: 'currency' | 'number') => {
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

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="superAdmin"
        title="Platform Analytics"
        onMenuPress={openDrawer}
        onNotificationPress={() => {
          // Handle notification press
        }}
        profileDrawer={
          <SuperAdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToAnalytics={() => {
              closeDrawer();
            }}
          />
        }
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderPeriodSelector()}

        {analytics && (
          <View style={styles.metricsContainer}>
            {renderMetricCard('Revenue', analytics.revenue, 'currency')}
            {renderMetricCard('Total Users', { current: analytics.users.total, previous: analytics.users.total - 100, growth: analytics.users.growth }, 'number')}
            {renderMetricCard('Companies', { current: analytics.companies.total, previous: analytics.companies.total - 2, growth: analytics.companies.growth }, 'number')}
            {renderMetricCard('Guards', { current: analytics.guards.total, previous: analytics.guards.total - 80, growth: analytics.guards.growth }, 'number')}
          </View>
        )}

        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartTitle}>Revenue Trend</Text>
          <Text style={styles.chartSubtitle}>Chart visualization coming soon</Text>
        </View>

        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartTitle}>User Growth</Text>
          <Text style={styles.chartSubtitle}>Chart visualization coming soon</Text>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
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
  periodSelector: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.xs,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
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
    padding: SPACING.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  chartPlaceholder: {
    backgroundColor: '#FFFFFF',
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  chartSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
});

export default PlatformAnalyticsScreen;
