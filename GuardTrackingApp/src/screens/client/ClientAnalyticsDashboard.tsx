/**
 * Client Analytics Dashboard - Phase 5
 * Performance metrics, report generation, and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { globalStyles, COLORS, TYPOGRAPHY, SPACING } from '../../styles/globalStyles';
import reportGenerationService, { ReportData } from '../../services/reportGenerationService';
import LiveActivityFeed from '../../components/client/LiveActivityFeed';
import { ErrorHandler } from '../../utils/errorHandler';

interface ClientAnalyticsDashboardProps {
  navigation: any;
}

const ClientAnalyticsDashboard: React.FC<ClientAnalyticsDashboardProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { dashboardStats } = useSelector((state: RootState) => state.client);

  const [reports, setReports] = useState<ReportData[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportData['type']>('shift_summary');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  });

  useEffect(() => {
    initializeService();
    loadReports();
  }, []);

  const initializeService = async () => {
    try {
      await reportGenerationService.initialize();
    } catch (error) {
      ErrorHandler.handleError(error, 'initialize_analytics_service');
    }
  };

  const loadReports = () => {
    const allReports = reportGenerationService.getReports();
    setReports(allReports);
  };

  const handleGenerateReport = async () => {
    try {
      let report: ReportData;

      switch (selectedReportType) {
        case 'shift_summary':
          report = await reportGenerationService.generateShiftSummaryReport(
            dateRange,
            {},
            selectedFormat
          );
          break;
        case 'incident_report':
          report = await reportGenerationService.generateIncidentReport(
            dateRange,
            {},
            selectedFormat
          );
          break;
        case 'guard_performance':
          report = await reportGenerationService.generateGuardPerformanceReport(
            dateRange,
            [],
            selectedFormat
          );
          break;
        case 'site_analytics':
          report = await reportGenerationService.generateSiteAnalyticsReport(
            dateRange,
            [],
            selectedFormat
          );
          break;
        default:
          throw new Error('Invalid report type');
      }

      setShowReportModal(false);
      loadReports();

      Alert.alert(
        'Report Generation Started',
        `Your ${selectedReportType.replace('_', ' ')} report is being generated. You'll be notified when it's ready.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      ErrorHandler.handleError(error, 'generate_report');
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }
  };

  const handleDownloadReport = (report: ReportData) => {
    if (report.status === 'completed') {
      Alert.alert(
        'Download Report',
        `Download ${report.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => console.log('Downloading:', report.fileUrl) },
        ]
      );
    } else {
      Alert.alert('Report Not Ready', 'This report is still being generated.');
    }
  };

  const getReportStatusColor = (status: ReportData['status']) => {
    switch (status) {
      case 'completed': return COLORS.success;
      case 'generating': return COLORS.warning;
      case 'failed': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderPerformanceMetrics = () => (
    <View style={styles.metricsContainer}>
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>95.2%</Text>
          <Text style={styles.metricLabel}>Guard Attendance</Text>
          <View style={[styles.trendIndicator, { backgroundColor: COLORS.success }]}>
            <Text style={styles.trendText}>+2.1%</Text>
          </View>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>12.5min</Text>
          <Text style={styles.metricLabel}>Avg Response Time</Text>
          <View style={[styles.trendIndicator, { backgroundColor: COLORS.success }]}>
            <Text style={styles.trendText}>-1.3min</Text>
          </View>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>23</Text>
          <Text style={styles.metricLabel}>Incidents This Month</Text>
          <View style={[styles.trendIndicator, { backgroundColor: COLORS.error }]}>
            <Text style={styles.trendText}>+5</Text>
          </View>
        </View>
        
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>98.7%</Text>
          <Text style={styles.metricLabel}>Site Coverage</Text>
          <View style={[styles.trendIndicator, { backgroundColor: COLORS.success }]}>
            <Text style={styles.trendText}>+0.5%</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderReportGeneration = () => (
    <View style={styles.reportsContainer}>
      <View style={styles.reportsHeader}>
        <Text style={styles.sectionTitle}>Report Generation</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => setShowReportModal(true)}
        >
          <Text style={styles.generateButtonText}>+ Generate Report</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.reportsList}>
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No reports generated yet</Text>
            <Text style={styles.emptyStateSubtext}>Generate your first report to get started</Text>
          </View>
        ) : (
          reports.slice(0, 5).map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportItem}
              onPress={() => handleDownloadReport(report)}
            >
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDate}>
                  Generated: {new Date(report.generatedAt).toLocaleDateString()}
                </Text>
                {report.fileSize && (
                  <Text style={styles.reportSize}>{formatFileSize(report.fileSize)}</Text>
                )}
              </View>
              
              <View style={styles.reportStatus}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getReportStatusColor(report.status) }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: getReportStatusColor(report.status) }
                ]}>
                  {report.status.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderReportModal = () => (
    <Modal
      visible={showReportModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Generate Report</Text>
          <TouchableOpacity onPress={() => setShowReportModal(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Report Type</Text>
            <View style={styles.optionsGrid}>
              {[
                { key: 'shift_summary', label: 'Shift Summary' },
                { key: 'incident_report', label: 'Incident Report' },
                { key: 'guard_performance', label: 'Guard Performance' },
                { key: 'site_analytics', label: 'Site Analytics' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    selectedReportType === option.key && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedReportType(option.key as ReportData['type'])}
                >
                  <Text style={[
                    styles.optionText,
                    selectedReportType === option.key && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Format</Text>
            <View style={styles.formatOptions}>
              {['pdf', 'excel', 'csv'].map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.formatButton,
                    selectedFormat === format && styles.formatButtonSelected,
                  ]}
                  onPress={() => setSelectedFormat(format as any)}
                >
                  <Text style={[
                    styles.formatText,
                    selectedFormat === format && styles.formatTextSelected,
                  ]}>
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Date Range</Text>
            <View style={styles.dateInputs}>
              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TextInput
                  style={styles.dateField}
                  value={dateRange.startDate}
                  onChangeText={(text) => setDateRange(prev => ({ ...prev, startDate: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TextInput
                  style={styles.dateField}
                  value={dateRange.endDate}
                  onChangeText={(text) => setDateRange(prev => ({ ...prev, endDate: text }))}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.generateReportButton}
            onPress={handleGenerateReport}
          >
            <Text style={styles.generateReportButtonText}>Generate Report</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPerformanceMetrics()}
        {renderReportGeneration()}
        
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Live Activity Feed</Text>
          <View style={styles.activityContainer}>
            <LiveActivityFeed
              maxItems={10}
              showFilters={true}
              onActivityPress={(activity) => console.log('Activity pressed:', activity)}
            />
          </View>
        </View>
      </ScrollView>
      
      {renderReportModal()}
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
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    marginRight: SPACING.md,
  },
  headerTitle: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  metricsContainer: {
    padding: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    position: 'relative',
  },
  metricValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  trendIndicator: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  reportsContainer: {
    padding: SPACING.md,
  },
  reportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  generateButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  reportsList: {
    gap: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  reportItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  reportDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  reportSize: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.textSecondary,
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  activitySection: {
    padding: SPACING.md,
  },
  activityContainer: {
    height: 400,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPrimary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  formatButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  formatButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  formatText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textPrimary,
  },
  formatTextSelected: {
    color: COLORS.textInverse,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  dateInputs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  dateField: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textPrimary,
  },
  generateReportButton: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  generateReportButtonText: {
    color: COLORS.textInverse,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default ClientAnalyticsDashboard;
