/**
 * Admin Analytics Screen - Performance analytics and reporting
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';
import { ReportsIcon, EmergencyIcon, CheckCircleIcon, UserIcon, ClockIcon } from '../../components/ui/AppIcons';
import { CalendarIcon, FileTextIcon } from '../../components/ui/FeatherIcons';
import SharedHeader from '../../components/ui/SharedHeader';
import SafeAreaWrapper from '../../components/common/SafeAreaWrapper';
import AdminProfileDrawer from '../../components/admin/AdminProfileDrawer';
import { useProfileDrawer } from '../../hooks/useProfileDrawer';
import AdminStatsCard from '../../components/ui/AdminStatsCard';

interface ReportData {
  id: string;
  type: string;
  title: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  generatedBy: string;
}

const AdminAnalyticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDrawerVisible, openDrawer, closeDrawer } = useProfileDrawer();
  
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [reports, setReports] = useState<ReportData[]>([]);
  
  const [metrics, setMetrics] = useState({
    totalReports: 156,
    completedReports: 142,
    pendingReports: 8,
    failedReports: 6,
    averageResponseTime: '2.4h',
    reportAccuracy: '94.2%',
  });

  useEffect(() => {
    loadReports();
  }, [selectedPeriod]);

  const loadReports = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
      
      // Mock report data
      setReports([
        {
          id: '1',
          type: 'Incident Report',
          title: 'Monthly Incident Summary',
          date: new Date().toISOString(),
          status: 'completed',
          generatedBy: 'System',
        },
        {
          id: '2',
          type: 'Performance Report',
          title: 'Guard Performance Analysis',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          generatedBy: 'Admin User',
        },
        {
          id: '3',
          type: 'Shift Report',
          title: 'Weekly Shift Coverage',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          generatedBy: 'System',
        },
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    Alert.alert('Generate Report', 'Report generation feature coming soon');
  };

  const handleDownloadReport = (reportId: string) => {
    Alert.alert('Download Report', `Downloading report ${reportId}...`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'failed': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <SafeAreaWrapper>
      <SharedHeader
        variant="admin"
        title="Analytics & Reports"
        showLogo={false}
        profileDrawer={
          <AdminProfileDrawer
            visible={isDrawerVisible}
            onClose={closeDrawer}
            onNavigateToAnalytics={() => {
              closeDrawer();
            }}
          />
        }
      />

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'Week' },
          { key: 'month', label: 'Month' },
          { key: 'year', label: 'Year' },
        ].map((period) => {
          const isActive = selectedPeriod === period.key;
          return (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                isActive && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text style={[
                styles.periodText,
                isActive && styles.periodTextActive,
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Metrics Cards */}
        <View style={styles.metricsGrid}>
          <AdminStatsCard
            icon={<ReportsIcon size={24} color={COLORS.primary} />}
            value={metrics.totalReports.toString()}
            label="Total Reports"
            subLabel="All time"
            iconBgColor="#DBEAFE"
            iconColor={COLORS.primary}
          />
          <AdminStatsCard
            icon={<CheckCircleIcon size={24} color={COLORS.success} />}
            value={metrics.completedReports.toString()}
            label="Completed"
            subLabel="Successfully generated"
            iconBgColor="#DCFCE7"
            iconColor={COLORS.success}
          />
          <AdminStatsCard
            icon={<ClockIcon size={24} color={COLORS.warning} />}
            value={metrics.pendingReports.toString()}
            label="Pending"
            subLabel="In progress"
            iconBgColor="#FEF3C7"
            iconColor={COLORS.warning}
          />
          <AdminStatsCard
            icon={<EmergencyIcon size={24} color={COLORS.error} />}
            value={metrics.failedReports.toString()}
            label="Failed"
            subLabel="Requires attention"
            iconBgColor="#FEE2E2"
            iconColor={COLORS.error}
          />
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{metrics.averageResponseTime}</Text>
              <Text style={styles.performanceLabel}>Avg Response Time</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{metrics.reportAccuracy}</Text>
              <Text style={styles.performanceLabel}>Report Accuracy</Text>
            </View>
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={handleGenerateReport}
            >
              <FileTextIcon size={16} color={COLORS.textInverse} />
              <Text style={styles.generateButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => handleDownloadReport(report.id)}
                activeOpacity={0.7}
              >
                <View style={styles.reportHeader}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportTitle}>{report.title}</Text>
                    <Text style={styles.reportType}>{report.type}</Text>
                  </View>
                  <View style={[
                    styles.reportStatusBadge,
                    { backgroundColor: getStatusColor(report.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.reportStatusText,
                      { color: getStatusColor(report.status) }
                    ]}>
                      {report.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.reportDetails}>
                  <View style={styles.reportDetailRow}>
                    <CalendarIcon size={14} color={COLORS.textSecondary} />
                    <Text style={styles.reportDetailText}>
                      {formatDate(report.date)}
                    </Text>
                  </View>
                  <View style={styles.reportDetailRow}>
                    <UserIcon size={14} color={COLORS.textSecondary} />
                    <Text style={styles.reportDetailText}>
                      {report.generatedBy}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <ReportsIcon size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyStateText}>No reports available</Text>
              <Text style={styles.emptyStateSubtext}>
                Generate a new report to get started
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundPrimary,
    gap: SPACING.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  periodTextActive: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  section: {
    backgroundColor: COLORS.backgroundPrimary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  performanceGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  performanceCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  performanceValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  performanceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  generateButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
  },
  reportCard: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  reportType: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  reportStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  reportStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  reportDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  reportDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  reportDetailText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});

export default AdminAnalyticsScreen;
